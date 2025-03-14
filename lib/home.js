async function home () {
  const { defaultsDeep } = this.app.bajo
  const { isString, pick } = this.lib._
  const config = this.getConfig()
  if (config.home) {
    if (isString(config.home)) config.home = { path: config.home }
    await this.instance.get('/', async function (req, reply) {
      if (!config.home.forward) return reply.redirectTo(config.home.path)
      const opts = defaultsDeep(pick(req, ['params', 'query']), pick(config.home, ['params', 'query']))
      return reply.forwardTo(config.home.path, opts)
    })
  }
}

export default home
