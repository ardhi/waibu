import collectRoutePathHandlers from './lib/collect-route-path-handlers.js'
import fastify from 'fastify'
import appHook from './lib/app-hook.js'
import routeHook from './lib/webapp-scope/route-hook.js'
import printRoutes from './lib/print-routes.js'
import { boot } from './lib/app.js'
import sensible from '@fastify/sensible'
import noIcon from 'fastify-no-icon'
import underPressure from '@fastify/under-pressure'
import handleForward from './lib/handle-forward.js'
import handleRedirect from './lib/handle-redirect.js'
import buildLocals from './lib/build-locals.js'
import queryString from 'query-string'

/**
 * @typedef TEscapeChars
 * @type {Object}
 * @memberof Waibu
 * @property {string} &lt;=&lt;
 * @property {string} &gt;=&gt;
 * @property {string} &quot;=&quot;
 * @property {string} &apos;=&apos;
 */

/**
 * Plugin factory
 *
 * @param {string} pkgName - NPM package name
 * @returns {class}
 */
async function factory (pkgName) {
  const me = this

  /**
   * Waibu Web Framework plugin for Bajo. This is the main foundation of all web apps attached to
   * the system through a route prefix. Those web apps are then build as childrens with
   * its own fastify's context.
   *
   * There are currently 3 web apps available:
   * - {@link https://github.com/ardhi/waibu-static|waibu-static} for static content delivery
   * - {@link https://github.com/ardhi/waibu-rest-api|waibu-rest-api} for rest api setup
   * - and {@link https://github.com/ardhi/waibu-mpa|waibu-mpa} for normal multi-page application
   *
   * You should write your code as the extension of above web apps. Not to this main app.
   * Unless, of course, if you want to write custom web apps with its own context.
   *
   * @class
   */
  class Waibu extends this.app.pluginClass.base {
    /**
     * @constant {string[]}
     * @default ['onRequest', 'onResponse', 'preParsing', 'preValidation', 'preHandler', 'preSerialization', 'onSend', 'onTimeout', 'onError']
     * @memberof Waibu
     */
    static hookTypes = ['onRequest', 'onResponse', 'preParsing', 'preValidation', 'preHandler',
      'preSerialization', 'onSend', 'onTimeout', 'onError']

    /**
     * @constant {string}
     * @memberof Waibu
     * @default 'w'
     */
    static alias = 'w'

    /**
     * @constant {string[]}
     * @default ['bajo-extra']
     * @memberof Waibu
     */
    static dependencies = ['bajo-extra']

    /**
     * @constant {TEscapeChars}
     * @memberof Waibu
     */
    static escapeChars = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    }

    constructor () {
      super(pkgName, me.app)

      /**
       * @see {@tutorial config}
       * @type {Object}
       */
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
        deferLog: false,
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
        printRoutes: true,
        pageTitleFormat: '%s : %s',
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
    }

    /**
     * Initialize plugin
     *
     * @method
     * @async
     */
    init = async () => {
      if (this.config.home === '/') this.config.home = false
      await collectRoutePathHandlers.call(this)
    }

    /**
     * Start plugin
     *
     * @method
     * @async
     */
    start = async () => {
      const { generateId, runHook } = this.app.bajo
      const cfg = this.getConfig()
      if (this.app.bajoLogger) {
        cfg.factory.loggerInstance = this.app.bajoLogger.instance.child(
          {},
          { msgPrefix: '[waibu] ' }
        )
      }
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
      if (cfg.printRoutes) printRoutes.call(this)
    }

    /**
     * Exit handler
     *
     * @method
     * @async
     */
    exit = async () => {
      this.instance.close()
    }

    /**
     * Find route by route name
     *
     * @param {string} name - ns based route name
     * @returns {Object} Route object
     */
    findRoute = (name) => {
      const { outmatch } = this.app.lib
      const { find } = this.app.lib._
      const { breakNsPath } = this.app.bajo
      let { ns, subNs = '', path } = breakNsPath(name)
      const params = path.split('|')
      if (params.length > 1) path = params[0]
      return find(this.routes, r => {
        if (r.path.startsWith('*')) return false
        r.config = r.config ?? {}
        const match = outmatch(r.config.pathSrc ?? r.path, { separator: false })
        if (!match(path)) return false
        return ns === r.config.ns && r.config.subNs === subNs
      })
    }

    get escapeChars () {
      return this.constructor.escapeChars
    }

    /**
     * Escape text
     *
     * @method
     * @param {string} text
     * @returns {string}
     */
    escape = (text = '') => {
      if (typeof text !== 'string') return text
      const { forOwn } = this.app.lib._
      forOwn(this.escapeChars, (v, k) => {
        text = text.replaceAll(k, v)
      })
      return text
    }

    /**
     * Fetch something from url. A wrapper of bajo-extra's fetchUrl which support
     * bajo's ns based url.
     *
     * @method
     * @async
     * @param {string} url - Also support ns based url
     * @param {Object} [opts={}] - node's fetch options
     * @param {Object} [extra={}] - See {@link https://ardhi.github.io/bajo-extra|bajo-extra}
     * @returns {Object}
     */
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

    /**
     * Get visitor IP from fastify's request object
     *
     * @method
     * @param {Object} req - request object
     * @returns {string}
     */
    getIp = (req) => {
      const { isEmpty } = this.app.lib._
      let fwd = req.headers['x-forwarded-for'] ?? ''
      if (!Array.isArray(fwd)) fwd = fwd.split(',').map(ip => ip.trim())
      return isEmpty(fwd[0]) ? req.ip : fwd[0]
    }

    /**
     * Get origin of fastify's request object
     *
     * @method
     * @param {Object} req
     * @returns {string}
     */
    getOrigin = (req) => {
      const { isEmpty } = this.app.lib._
      let host = req.host
      if (isEmpty(host) || host === ':authority') host = `${this.config.server.host}:${this.config.server.port}`
      return `${req.protocol}://${host}`
    }

    /**
     * Get plugin by prefix
     *
     * @method
     * @param {string} prefix
     * @returns {Object}
     */
    getPluginByPrefix = (prefix) => {
      const { get, find } = this.app.lib._
      const item = find(this.app.waibu.routes, r => {
        return get(r, 'config.prefix') === prefix
      })
      const ns = get(item, 'config.ns')
      if (ns) return this.app[ns]
    }

    /**
     * Get plugin's prefix by name
     *
     * @method
     * @param {string} name - Plugin's name
     * @param {string} [webApp=waibuMpa] - Web app to use
     * @returns {string}
     */
    getPluginPrefix = (name, webApp = 'waibuMpa') => {
      const { get, trim } = this.app.lib._
      let prefix = get(this, `app.${name}.config.waibu.prefix`, this.app[name].alias)
      if (name === 'main') {
        const cfg = this.app[webApp].config
        if (cfg.mountMainAsRoot) prefix = ''
      }

      return trim(prefix, '/')
    }

    /**
     * Get all available routes
     *
     * @method
     * @param {boolean} [grouped=false] - Returns as groups of urls and methods
     * @param {*} [lite=false] - Retuns only urls and methods
     * @returns {Array}
     */
    getRoutes = (grouped = false, lite = false) => {
      const { groupBy, orderBy, mapValues, map, pick } = this.app.lib._
      const all = this.routes
      let routes
      if (grouped) {
        const group = groupBy(orderBy(all, ['url', 'method']), 'url')
        routes = lite ? mapValues(group, (v, k) => map(v, 'method')) : group
      } else if (lite) routes = map(all, a => pick(a, ['url', 'method']))
      else routes = all
      return routes
    }

    /**
     * Get uploaded files by request ID
     *
     * @method
     * @param {string} reqId - Request ID
     * @param {boolean} [fileUrl=false] - If ```true```, files returned as file url format (```file:///...```)
     * @param {*} returnDir - If ```true```, also return its directory
     * @returns {(Object|Array)} - Returns object if ```returnDir``` is ```true```, array of files otherwise
     */
    getUploadedFiles = async (reqId, fileUrl = false, returnDir = false) => {
      const { getPluginDataDir, resolvePath } = this.app.bajo
      const { fastGlob } = this.app.lib
      const dir = `${getPluginDataDir(this.name)}/upload/${reqId}`
      const result = await fastGlob(`${dir}/*`)
      if (!fileUrl) return returnDir ? { dir, files: result } : result
      const files = result.map(f => resolvePath(f, true))
      return returnDir ? { dir, files } : files
    }

    /**
     * Is namespace's path contains language detector token?
     *
     * @method
     * @param {string} ns - Plugin name
     * @returns {boolean}
     */
    isIntlPath = (ns) => {
      const { get } = this.app.lib._
      return get(this.app[ns], 'config.intl.detectors', []).includes('path')
    }

    notFound = (name, options) => {
      throw this.error('_notFound', { path: name })
    }

    /**
     * Parse filter found from Fastify's request based on keys set in config object
     *
     * @method
     * @param {Object} req - Request object
     * @returns {Object}
     */
    parseFilter = (req) => {
      const result = {}
      const items = Object.keys(this.config.qsKey)
      for (const item of items) {
        result[item] = req.query[this.config.qsKey[item]]
      }
      return result
    }

    /**
     * Get route directory by plugin's name
     *
     * @param {*} ns - Namespace
     * @param {*} [baseNs] - Base namespace. If not provided, defaults to scope's ns
     * @returns {string}
     */
    routeDir = (ns, baseNs) => {
      const { get } = this.app.lib._
      if (!baseNs) baseNs = ns
      const cfg = this.app[baseNs].config
      const prefix = get(cfg, 'waibu.prefix', this.app[baseNs].alias)
      const dir = prefix === '' ? '' : `/${prefix}`
      const cfgMpa = get(this, 'app.waibuMpa.config')
      if (ns === this.app.mainNs && cfgMpa.mountMainAsRoot) return ''
      if (ns === baseNs) return dir
      return dir + `/${get(this.app[ns].config, 'waibu.prefix', this.app[ns].alias)}`
    }

    /**
     * Get route path by route's name:
     * - If it is a ```mailto:``` or ```tel:``` url, it returns as is
     * - If it is a ns based name, it will be parsed first
     *
     * @method
     * @param {string} name
     * @param {Object} [options={}] - Options object
     * @param {string} [options.base=waibu] - Base namespace
     * @param {boolean} [options.guessHost] - If true, guest host if host is not set
     * @param {Object} [options.query={}] - Query string's object. If provided, it will be added to returned value
     * @param {Object} [options.params={}] - Parameter object. If provided, it will be merged to returned value
     * @returns {string}
     */
    routePath = (name, options = {}) => {
      const { getPlugin } = this.app.bajo
      const { defaultsDeep } = this.app.lib.aneka
      const { isEmpty, get, trimEnd, trimStart } = this.app.lib._
      const { breakNsPath } = this.app.bajo
      const { query = {}, base = this.name, params = {}, guessHost } = options

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

    /**
     * Method to send mail through Masohi Messaging System. It is a thin wrapper
     * for {@link https://github.com/ardhi/masohi-mail|masohi-mail} send method.
     *
     * If masohi is not loaded, nothing is delivered.
     *
     * @method
     * @async
     * @param {(string|Array)} tpl - Mail's template to use. If a string is given, the same template will be used for html & plaintext versions. Otherwise, the first template will be used for html mail, and the second one is for it's plaintext version
     * @param {Object} [params={}] - {@link https://github.com/ardhi/masohi-mail|masohi-mail}'s params object.
     * @returns
     */
    sendMail = async (tpl, { to, cc, bcc, from, subject, data = {}, conn, source, options = {} }) => {
      conn = conn ?? 'masohiMail:default'
      if (!this.app.masohi || !this.app.masohiMail) return
      const { get, isString } = this.app.lib._
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
      const payload = { type: 'object', data: { to, cc, bcc, from, subject, message, options: opts } }
      await this.app.masohi.send({ payload, source: source ?? this.name, conn }) // mail sent through worker
    }

    /**
     * Recursively unescape block of texts
     *
     * @method
     * @param {string} content - Source content
     * @param {string} start - Block's start
     * @param {string} end - Block's end
     * @param {string} startReplacer - Token to use as block's start replacer
     * @param {string} endReplacer - Token to use as block's end replacer
     * @returns {string}
     */
    unescapeBlock = (content, start, end, startReplacer, endReplacer) => {
      const { extractText } = this.app.lib.aneka
      const { result } = extractText(content, start, end)
      if (result.length === 0) return content
      const unescaped = this.unescape(result)
      const token = `${start}${result}${end}`
      const replacer = `${startReplacer}${unescaped}${endReplacer}`
      const block = content.replaceAll(token, replacer)
      return this.unescapeBlock(block, start, end, startReplacer, endReplacer)
    }

    /**
     * Unescape text using {@link TEscapeChars} rules
     *
     * @method
     * @param {string} text - Text to unescape
     * @returns {string}
     */
    unescape = (text) => {
      const { forOwn, invert } = this.app.lib._
      const mapping = invert(this.escapeChars)
      forOwn(mapping, (v, k) => {
        text = text.replaceAll(k, v)
      })
      return text
    }
  }

  return Waibu
}

export default factory
