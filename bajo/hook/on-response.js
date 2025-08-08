export const methodColor = {
  GET: 'blue',
  POST: 'green',
  UPDATE: 'yellow',
  PATCH: 'yellow',
  DELETE: 'red'
}

const stateColor = {
  2: 'green',
  3: 'yellow',
  4: 'red',
  5: 'red'
}

const onResponse = {
  level: 5,
  handler: async function onResponse (req, reply) {
    const { importPkg } = this.app.bajo
    const { get } = this.lib._
    const { plain } = this.app.bajo.config.log
    const chalk = await importPkg('bajo:chalk')
    let level = 'info'
    if (reply.statusCode >= 300 && reply.statusCode < 400) level = 'warn'
    else if (reply.statusCode >= 400) level = 'error'
    const ns = get(reply.request, 'routeOptions.config.webApp') ?? this.name
    const arrow = plain ? '>' : chalk.bold('🡪')
    const mc = methodColor[req.method] ?? 'gray'
    const method = plain ? req.method : chalk[mc](req.method)
    const url = plain ? (':' + req.url) : chalk.gray(':' + req.url)
    let state = plain ? reply.statusCode : chalk.gray(reply.statusCode)
    const sc = stateColor[Math.floor(reply.statusCode / 100)]
    if (!plain && sc) state = chalk[sc](reply.statusCode)
    const elapsed = reply.elapsedTime ?? 0
    let tc = 'red'
    if (elapsed < 1000) tc = 'yellow'
    if (elapsed < 500) tc = 'green'
    const time = plain ? elapsed.toFixed(2) : chalk[tc](elapsed.toFixed(2))
    if (this.config.deferLog) {
      this.reqLog = this.reqLog ?? {}
      if (this.reqLog[req.id]) this.app[ns].log.info(this.reqLog[req.id])
      delete this.reqLog[req.id]
    }
    this.app[ns].log[level]('httpResp%s%s%s%s%s', arrow, method, url, state, time)
  }
}

export default onResponse
