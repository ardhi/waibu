const onRequest = {
  level: 5,
  handler: async function onRequest (req, reply) {
    const { get } = this.app.bajo.lib._

    req.site = this.config.siteInfo
    req.ns = get(reply.request, 'routeOptions.config.ns') ?? this.name
    const ns = get(reply.request, 'routeOptions.config.webApp') ?? this.name
    let msg = '< %s:%s from IP %s'
    if (req.headers['content-length']) msg += ', content length: %s'
    this.app[ns].log.info(msg, req.method, req.url, this.getIp(req), req.headers['content-length'])
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
