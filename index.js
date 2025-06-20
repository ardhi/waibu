import collectRoutePathHandlers from './lib/collect-route-path-handlers.js'
import fastify from 'fastify'
import appHook from './lib/app-hook.js'
import routeHook from './lib/webapp-scope/route-hook.js'
import logRoutes from './lib/log-routes.js'
import { boot } from './lib/app.js'
import sensible from '@fastify/sensible'
import noIcon from 'fastify-no-icon'
import underPressure from '@fastify/under-pressure'
import handleForward from './lib/handle-forward.js'
import handleRedirect from './lib/handle-redirect.js'
import buildLocals from './lib/build-locals.js'
import queryString from 'query-string'

async function factory (pkgName) {
  const me = this

  return class Waibu extends this.lib.BajoPlugin {
    constructor () {
      super(pkgName, me.app)
      this.alias = 'w'
      this.dependencies = ['bajo-logger', 'bajo-extra']
      this.config = {
        server: {
          host: '127.0.0.1',
          port: 7771
        },
        factory: {
          trustProxy: true,
          bodyLimit: 10485760,
          pluginTimeout: 30000
        },
        prefixVirtual: '~',
        qsKey: {
          bbox: 'bbox',
          bboxLatField: 'bboxLatField',
          bboxLngField: 'bboxLngField',
          query: 'query',
          match: 'match',
          skip: 'skip',
          page: 'page',
          limit: 'limit',
          sort: 'sort',
          fields: 'fields',
          lang: 'lang'
        },
        paramsCharMap: {},
        logRoutes: true,
        siteInfo: {
          title: 'My Website',
          orgName: 'My Organization'
        },
        cors: {},
        compress: {},
        helmet: {},
        rateLimit: {},
        multipart: {
          attachFieldsToBody: true,
          limits: {
            parts: 100,
            fileSize: 10485760
          }
        },
        noIcon: true,
        underPressure: false,
        forwardOpts: {
          disableRequestLogging: true,
          undici: {
            connections: 128,
            pipelining: 1,
            keepAliveTimeout: 60 * 1000,
            tls: {
              rejectUnauthorized: false
            }
          }
        }
      }
      this.escapeChars = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
      }
      this.qs = {
        parse: (item) => {
          return queryString.parse(item, {
            parseBooleans: true,
            parseNumbers: true
          })
        },
        parseUrl: queryString.parseUrl,
        stringify: queryString.stringify,
        stringifyUrl: queryString.stringifyUrl
      }
      this.hookTypes = ['onRequest', 'onResponse', 'preParsing', 'preValidation', 'preHandler',
        'preSerialization', 'onSend', 'onTimeout', 'onError']
    }

    init = async () => {
      if (this.config.home === '/') this.config.home = false
      await collectRoutePathHandlers.call(this)
    }

    start = async () => {
      const { generateId, runHook } = this.app.bajo
      const cfg = this.getConfig()
      cfg.factory.loggerInstance = this.app.bajoLogger.instance.child(
        {},
        { msgPrefix: '[waibu] ' }
      )
      cfg.factory.genReqId = req => generateId()
      cfg.factory.disableRequestLogging = true
      cfg.factory.querystringParser = str => this.qs.parse(str)

      const instance = fastify(cfg.factory)
      instance.decorateRequest('lang', null)
      instance.decorateRequest('t', () => {})
      instance.decorateRequest('format', () => {})
      instance.decorateRequest('langDetector', null)
      instance.decorateRequest('site', null)
      instance.decorateRequest('ns', null)
      this.instance = instance
      this.routes = this.routes || []
      await runHook('waibu:afterCreateContext', instance)
      await instance.register(sensible)
      if (cfg.underPressure) await instance.register(underPressure)
      if (cfg.noIcon) await instance.register(noIcon)
      await handleRedirect.call(this, instance)
      await handleForward.call(this, instance)
      await appHook.call(this)
      await routeHook.call(this, this.name)
      await boot.call(this)
      await instance.listen(cfg.server)
      if (cfg.logRoutes) logRoutes.call(this)
    }

    exit = async () => {
      this.instance.close()
    }

    findRoute (route) {
      const { outmatch } = this.lib
      const { find } = this.lib._
      const { breakNsPath } = this.app.bajo
      const { ns, subNs = '', path } = breakNsPath(route)
      return find(this.routes, r => {
        if (r.path.startsWith('*')) return false
        r.config = r.config ?? {}
        const match = outmatch(r.config.pathSrc ?? r.path, { separator: false })
        if (!match(path)) return false
        return ns === r.config.ns && r.config.subNs === subNs
      })
    }

    escape = (text = '') => {
      if (typeof text !== 'string') return text
      const { forOwn } = this.lib._
      forOwn(this.escapeChars, (v, k) => {
        text = text.replaceAll(k, v)
      })
      return text
    }

    fetch = async (url, opts = {}, extra = {}) => {
      const { fetch } = this.app.bajoExtra
      extra.rawResponse = true

      url = this.routePath(url, { guessHost: true })
      const resp = await fetch(url, opts, extra)
      const result = await resp.json()
      if (!resp.ok) {
        throw this.error(result.message, {
          statusCode: resp.status,
          success: false
        })
      }
      return result
    }

    getIp = (req) => {
      let fwd = req.headers['x-forwarded-for'] ?? ''
      if (!Array.isArray(fwd)) fwd = fwd.split(',').map(ip => ip.trim())
      return fwd[0] ?? req.ip
    }

    getPluginByPrefix = (prefix) => {
      const { get, find } = this.lib._
      const item = find(this.app.waibu.routes, r => {
        return get(r, 'config.prefix') === prefix
      })
      const ns = get(item, 'config.ns')
      if (ns) return this.app[ns]
    }

    getPluginPrefix = (base, webApp = 'waibuMpa') => {
      const { get, trim } = this.lib._
      let prefix = get(this, `app.${base}.config.waibu.prefix`, this.app[base].alias)
      if (base === 'main') {
        const cfg = this.app[webApp].config
        if (cfg.mountMainAsRoot) prefix = ''
      }

      return trim(prefix, '/')
    }

    getRoutes = (grouped, lite) => {
      const { groupBy, orderBy, mapValues, map, pick } = this.lib._
      const all = this.routes
      let routes
      if (grouped) {
        const group = groupBy(orderBy(all, ['url', 'method']), 'url')
        routes = lite ? mapValues(group, (v, k) => map(v, 'method')) : group
      } else if (lite) routes = map(all, a => pick(a, ['url', 'method']))
      else routes = all
      return routes
    }

    getUploadedFiles = async (reqId, fileUrl, returnDir) => {
      const { getPluginDataDir, resolvePath } = this.app.bajo
      const { fastGlob } = this.lib
      const dir = `${getPluginDataDir(this.name)}/upload/${reqId}`
      const result = await fastGlob(`${dir}/*`)
      if (!fileUrl) return returnDir ? { dir, files: result } : result
      const files = result.map(f => resolvePath(f, true))
      return returnDir ? { dir, files } : files
    }

    isIntlPath = (ns) => {
      const { get } = this.lib._
      return get(this.app[ns], 'config.intl.detectors', []).includes('path')
    }

    notFound = (name, options) => {
      throw this.error('_notFound', { path: name })
    }

    parseFilter = (req) => {
      const result = {}
      const items = Object.keys(this.config.qsKey)
      for (const item of items) {
        result[item] = req.query[this.config.qsKey[item]]
      }
      return result
    }

    routeDir = (ns, base) => {
      const { get } = this.lib._
      if (!base) base = ns
      const cfg = this.app[base].config
      const prefix = get(cfg, 'waibu.prefix', this.app[base].alias)
      const dir = prefix === '' ? '' : `/${prefix}`
      if (!ns) return dir
      const cfgMpa = get(this, 'app.waibuMpa.config')
      if (ns === this.app.bajo.mainNs && cfgMpa.mountMainAsRoot) return ''
      if (ns === base) return dir
      return dir + `/${get(this.app[ns].config, 'waibu.prefix', this.app[ns].alias)}`
    }

    routePath = (name = '', options = {}) => {
      const { getPlugin } = this.app.bajo
      const { defaultsDeep } = this.lib.aneka
      const { isEmpty, get, trimEnd, trimStart } = this.lib._
      const { breakNsPath } = this.app.bajo
      const { query = {}, base = 'waibu', params = {}, guessHost } = options

      const plugin = getPlugin(base)
      const cfg = plugin.config ?? {}
      let info = {}
      if (name.startsWith('mailto:') || name.startsWith('tel:')) return name
      if (['%', '.', '/', '?', '#'].includes(name[0]) || name.slice(1, 2) === ':') info.path = name
      else if (['~'].includes(name[0])) info.path = name.slice(1)
      else {
        info = breakNsPath(name)
      }
      if (info.path.slice(0, 2) === './') info.path = info.path.slice(2)
      if (this.routePathHandlers[info.subNs]) return this.routePathHandlers[info.subNs].handler(name, options)
      if (info.path.includes('//')) return info.path

      info.path = info.path.split('/').map(p => {
        return p[0] === ':' && params[p.slice(1)] ? params[p.slice(1)] : p
      }).join('/')
      let url = info.path
      const langDetector = get(cfg, 'intl.detectors', [])
      if (info.ns) url = trimEnd(langDetector.includes('path') ? `/${params.lang ?? ''}${this.routeDir(info.ns)}${info.path}` : `${this.routeDir(info.ns)}${info.path}`, '/')
      if (options.uriEncoded) url = url.split('/').map(u => encodeURI(u)).join('/')
      info.qs = defaultsDeep({}, query, info.qs)
      if (!isEmpty(info.qs)) url += '?' + this.qs.stringify(info.qs)
      if (!url.startsWith('http') && guessHost) url = `http://${this.config.server.host}:${this.config.server.port}/${trimStart(url, '/')}`
      return url
    }

    sendMail = async (tpl, { to, cc, bcc, from, subject, data = {}, conn, options = {} }) => {
      if (!this.app.masohiMail) return
      const { get, isString } = this.lib._
      const { generateId } = this.app.bajo
      const { render } = this.app.bajoTemplate
      if (isString(tpl)) tpl = [tpl]
      const locals = await buildLocals.call(this, { tpl, params: data, opts: options })
      const opts = {
        lang: get(options, 'req.lang'),
        groupId: get(options, 'req.id', generateId())
      }
      const message = await render(tpl[0], locals, opts)
      if (tpl[1]) opts.messageText = await render(tpl[1], locals, opts)
      const payload = { type: 'object', data: { to, cc, bcc, from, subject, message, conn, options: opts } }
      await this.app.masohi.send({ payload, source: this.name }, false) // mail sent through worker
    }

    unescapeBlock = (content, start, end, startReplacer, endReplacer) => {
      const { extractText } = this.lib.aneka
      const { result } = extractText(content, start, end)
      if (result.length === 0) return content
      const unescaped = this.unescape(result)
      const token = `${start}${result}${end}`
      const replacer = `${startReplacer}${unescaped}${endReplacer}`
      const block = content.replaceAll(token, replacer)
      return this.unescapeBlock(block, start, end, startReplacer, endReplacer)
    }

    unescape = (text) => {
      const { forOwn, invert } = this.lib._
      const mapping = invert(this.escapeChars)
      forOwn(mapping, (v, k) => {
        text = text.replaceAll(k, v)
      })
      return text
    }
  }
}

export default factory
