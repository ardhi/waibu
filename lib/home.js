async function home () {
  const { callHandler } = this.app.bajo
  const { defaultsDeep } = this.app.lib.aneka
  const { isString, pick } = this.app.lib._
  const config = this.getConfig()
  if (config.home) {
    if (isString(config.home)) config.home = { path: config.home }
    if (config.home.pathHandler) config.home.path = await callHandler(config.home.pathHandler)
    await this.instance.get('/', async function (req, reply) {
      if (!config.home.forward) return reply.redirectTo(config.home.path)
      const opts = defaultsDeep(pick(req, ['params', 'query']), pick(config.home, ['params', 'query']))
      return reply.forwardTo(config.home.path, opts)
    })
  }
}

export default home
