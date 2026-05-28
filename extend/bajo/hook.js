export const methodColor = {
  GET: 'blue',
  POST: 'green',
  UPDATE: 'yellow',
  PATCH: 'yellow',
  DELETE: 'red'
}

async function hook () {
  return [{
    name: 'waibu:onClose',
    handler: async function () {
      this.log.info('serverIs%s', this.t('closedL'))
    }
  }, {
    name: 'waibu:onReady',
    handler: async function () {
      this.log.info('serverIs%s', this.t('readyL'))
    }
  }, {
    level: 5,
    name: 'waibu:onRequest',
    handler: async function onRequest (req, reply) {
      const { importPkg } = this.app.bajo
      const { get } = this.app.lib._
      const chalk = await importPkg('bajo:chalk')
      const { plain } = this.app.bajo.config.log

      req.site = this.config.siteInfo
      req.ns = get(reply.request, 'routeOptions.config.ns') ?? this.ns
      const ns = get(reply.request, 'routeOptions.config.webApp') ?? this.ns
      const arrow = plain ? '<' : chalk.bold('🡨')
      const c = methodColor[req.method] ?? 'gray'
      const method = plain ? req.method : chalk[c](req.method)
      const url = plain ? (':' + req.url) : chalk.gray(':' + req.url)
      const ip = plain ? this.getIp(req) : chalk.magenta(this.getIp(req))
      let msg = this.app[ns].t('httpReq%s%s%s%s', arrow, method, url.replaceAll('%', '%%'), ip)
      if (req.headers['content-length']) msg += this.app[ns].t('httpReqExt%s', req.headers['content-length'])
      if (this.config.log.defer) {
        this.reqLog = this.reqLog ?? {}
        this.reqLog[req.id] = msg
      } else if (!this.config.log.noReq) this.app[ns].log.info(msg)
      if (Object.keys(this.config.paramsCharMap).length === 0) return
      for (const key in req.params) {
        let val = req.params[key]
        if (typeof val !== 'string') continue
        for (const char in this.config.paramsCharMap) {
          val = val.replaceAll(char, this.config.paramsCharMap[char])
        }
        req.params[key] = val
      }
    }
  }, {
    level: 5,
    name: 'waibu:onRoute',
    handler: async function (opts) {
      this.routes.push(opts)
    }
  }, {
    level: 9,
    name: 'waibu:preParsing',
    handler: async function (req, reply) {
      const { importModule } = this.app.bajo
      const attachIntl = await importModule('waibu:/lib/webapp-scope/attach-intl.js')
      await attachIntl.call(this, this.config.intl.detectors, req, reply)
    }
  }]
}

export default hook
