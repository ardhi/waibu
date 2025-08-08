import { methodColor } from './on-response.js'

const onRequest = {
  level: 5,
  handler: async function onRequest (req, reply) {
    const { importPkg } = this.app.bajo
    const { get } = this.lib._
    const chalk = await importPkg('bajo:chalk')
    const { plain } = this.app.bajo.config.log

    req.site = this.config.siteInfo
    req.ns = get(reply.request, 'routeOptions.config.ns') ?? this.name
    const ns = get(reply.request, 'routeOptions.config.webApp') ?? this.name
    const arrow = plain ? '<' : chalk.bold('🡨')
    const c = methodColor[req.method] ?? 'gray'
    const method = plain ? req.method : chalk[c](req.method)
    const url = plain ? (':' + req.url) : chalk.gray(':' + req.url)
    const ip = plain ? this.getIp(req) : chalk.magenta(this.getIp(req))
    let msg = this.app[ns].print.write('httpReq%s%s%s%s', arrow, method, url, ip)
    if (req.headers['content-length']) msg += this.app[ns].print.write('httpReqExt%s', req.headers['content-length'])
    if (this.config.deferLog) {
      this.reqLog = this.reqLog ?? {}
      this.reqLog[req.id] = msg
    } else this.app[ns].log.info(msg)
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
}

export default onRequest
