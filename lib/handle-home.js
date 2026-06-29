async function handleHome () {
  const { defaultsDeep } = this.app.lib.aneka
  const { pick } = this.app.lib._
  const me = this
  this.instance.get('/', async function (req, reply) {
    const home = req.getSetting('waibu:home', {})
    if (!home.path) throw me.error('_notFound')
    home.options = home.options ?? {}
    home.options.throwError = true
    if (!home.forward) return reply.redirectTo(home.path, home.options)
    const opts = defaultsDeep(pick(req, ['params', 'query']), pick(home, ['params', 'query']))
    return reply.forwardTo(home.path, opts)
  })
}

export default handleHome
