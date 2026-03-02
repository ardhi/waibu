import collectRoutePathHandlers from './lib/collect-route-path-handlers.js'
import fastify from 'fastify'
import handleAppHook from './lib/handle-app-hook.js'
import routeHook from './lib/webapp-scope/route-hook.js'
import printRoutes from './lib/print-routes.js'
import webApp from './lib/web-app.js'
import sensible from '@fastify/sensible'
import underPressure from '@fastify/under-pressure'
import handleForward from './lib/handle-forward.js'
import handleRedirect from './lib/handle-redirect.js'
import handleFavicon from './lib/handle-favicon.js'
import handleError from './lib/handle-error.js'
import handleNotFound from './lib/handle-not-found.js'
import handleHome from './lib/handle-home.js'
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
  class Waibu extends this.app.baseClass.Base {
    /**
     * @constant {string[]}
     * @default ['onRequest', 'onResponse', 'preParsing', 'preValidation', 'preHandler', 'preSerialization', 'onSend', 'onTimeout', 'onError']
     * @memberof Waibu
     */
    static hookTypes = ['onRequest', 'onResponse', 'preParsing', 'preValidation', 'preHandler',
      'preSerialization', 'onSend', 'onTimeout', 'onError']

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
        home: undefined,
        server: {
          host: '127.0.0.1',
          port: 17845
        },
        factory: {
          trustProxy: true,
          bodyLimit: 10485760,
          pluginTimeout: 30000,
          routerOptions: {
          }
        },
        intl: {
          detectors: ['qs']
        },
        deferLog: false,
        prefixVirtual: '~',
        qsKey: {
          bbox: 'bbox',
          bboxLatField: 'bboxLatField',
          bboxLngField: 'bboxLngField',
          query: 'query',
          search: 'search',
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
        favicon: false,
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
      const { runHook } = this.app.bajo
      const { generateId } = this.app.lib.aneka
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

      this.instance = fastify(cfg.factory)
      this.instance.decorateRequest('lang', null)
      this.instance.decorateRequest('t', () => {})
      this.instance.decorateRequest('format', () => {})
      this.instance.decorateRequest('langDetector', null)
      this.instance.decorateRequest('site', null)
      this.instance.decorateRequest('ns', null)
      this.routes = this.routes || []
      await runHook('waibu:afterCreateContext', this.instance)
      await this.instance.register(sensible)
      if (cfg.underPressure) await this.instance.register(underPressure)
      await handleFavicon.call(this)
      await handleRedirect.call(this)
      await handleForward.call(this)
      await handleAppHook.call(this)
      await handleError.call(this)
      await routeHook.call(this, this.ns)
      await webApp.call(this)
      await handleHome.call(this)
      await handleNotFound.call(this)
      await this.instance.listen(cfg.server)
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
     * Get origin from fastify's request object
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
     * Get hostname from fastify's request object
     *
     * @param {Object} req
     * @returns {string}
     */
    getHostname = (req) => {
      return req.hostname.split(':')[0]
    }

    /**
     * Get plugin by prefix
     *
     * @method
     * @param {string} prefix
     * @param {boolean} nsOnly - Set ```true``` to return plugin's namespace only
     * @returns {Object}
     */
    getPluginByPrefix = (prefix, nsOnly) => {
      const { get, find } = this.app.lib._
      const ns = find(this.app.getAllNs(), p => {
        return get(this, `app.${p}.config.waibu.prefix`) === prefix
      })
      if (!ns) return
      return nsOnly ? ns : this.app[ns]
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
      let prefix = get(this, `app.${name}.config.${webApp}.prefix`, get(this, `app.${name}.config.waibu.prefix`, this.app[name].alias))
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
      const { getPluginDataDir } = this.app.bajo
      const { resolvePath } = this.app.lib.aneka
      const { fastGlob } = this.app.lib
      const dir = `${getPluginDataDir(this.ns)}/upload/${reqId}`
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
    routePath = (name = '', options = {}) => {
      const { getPlugin } = this.app.bajo
      const { defaultsDeep } = this.app.lib.aneka
      const { isEmpty, get, trimEnd, trimStart } = this.app.lib._
      const { breakNsPath } = this.app.bajo
      const { query = {}, base = this.ns, params = {}, guessHost, defaults = {} } = options

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
        if (!(p[0] === ':' || (p[0] === '{' && p[p.length - 1] === '}'))) return p
        const _p = p
        p = p.replace(':', '').replace('{', '').replace('}', '')
        if (params[p]) return params[p]
        if (defaults[p]) return defaults[p]
        return _p
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

    arrayToAttr = (array = [], delimiter = ' ') => {
      const { isPlainObject } = this.app.lib._
      return array.map(item => {
        if (isPlainObject(item)) return this.objectToAttr(item)
        return item
      }).join(delimiter)
    }

    attrToArray = (text = '', delimiter = ' ') => {
      const { map, trim, without, isArray } = this.app.lib._
      if (text === true) text = ''
      if (isArray(text)) text = text.join(delimiter)
      return without(map(text.split(delimiter), i => trim(i)), '', undefined, null).map(item => {
        return item
      })
    }

    attrToObject = (text = '', delimiter = ';', kvDelimiter = ':') => {
      const { camelCase, isPlainObject } = this.app.lib._
      const result = {}
      if (isPlainObject(text)) text = this.objectToAttr(text)
      if (typeof text !== 'string') return text
      if (text.slice(1, 3) === '%=') return text
      const array = this.attrToArray(text, delimiter)
      array.forEach(item => {
        const [key, val] = this.attrToArray(item, kvDelimiter)
        result[camelCase(key)] = val
      })
      return result
    }

    base64JsonDecode = (data = 'e30=') => {
      return JSON.parse(Buffer.from(data, 'base64'))
    }

    base64JsonEncode = (data) => {
      return Buffer.from(JSON.stringify(data)).toString('base64')
    }

    objectToAttr = (obj = {}, delimiter = ';', kvDelimiter = ':') => {
      const { forOwn, kebabCase } = this.app.lib._
      const result = []
      forOwn(obj, (v, k) => {
        result.push(`${kebabCase(k)}${kvDelimiter}${v ?? ''}`)
      })
      return result.join(delimiter)
    }
  }

  return Waibu
}

export default factory
