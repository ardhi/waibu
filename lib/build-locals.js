function buildHomesMenu () {
  const { get, find, orderBy } = this.app.bajo.lib._
  const routes = []
  for (const ns of this.app.bajo.pluginNames) {
    const href = get(this, `app.${ns}.config.waibuMpa.home`)
    if (!href) continue
    const item = { href, ns, title: get(this, `app.${ns}.config.waibu.title`, this.app[ns].title) }
    if (!find(routes, { href })) routes.push(item)
  }
  return orderBy(routes, ['title'])
}

async function buildLocals ({ tpl, params = {}, opts = {} } = {}) {
  const { runHook } = this.app.bajo
  const { set, merge, pick, get, isEmpty, find } = this.app.bajo.lib._
  const { req, reply } = opts

  const appTitle = this.app.waibuMpa ? this.app.waibuMpa.getAppTitle(req.ns) : undefined
  params.page = merge(params.page ?? {}, { ns: req.ns, appTitle })
  set(params, 'menu.homes', buildHomesMenu.call(this))

  const { site, user, lang, darkMode } = req
  const theme = pick(find(this.themes, { name: req.theme }) ?? {}, ['name', 'framework'])
  const iconset = pick(find(this.iconsets, { name: req.iconset }) ?? {}, ['name'])
  const routeOpts = get(req, 'routeOptions.config', {})
  const _meta = { theme, iconset, site, user, lang, darkMode, routeOpts }
  _meta.site = _meta.site ?? {}
  merge(_meta, pick(req, ['url', 'params', 'query']))
  _meta.env = this.app.bajo.config.env
  _meta.url = _meta.url.split('?')[0].split('#')[0]
  if (req.session) _meta.prevUrl = req.session.prevUrl
  _meta.route = get(req, 'routeOptions.url')
  _meta.template = tpl
  _meta.hostHeader = req.headers.host
  _meta.statusCode = 200
  if (params.error) {
    if (params.error.statusCode) _meta.statusCode = params.error.statusCode
    _meta.errorMessage = params.error.message
  }
  if (reply && req.session && req.flash && !opts.partial) _meta.flash = reply.flash()
  const merged = merge({}, params, { _meta })
  await runHook(`${this.name}:afterBuildLocals`, merged, req)
  if (!isEmpty(routeOpts.ns)) await runHook(`${this.name}.${routeOpts.ns}:afterBuildLocals`, merged, req)
  return merged
}

export default buildLocals
