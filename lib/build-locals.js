function buildHomesMenu (req) {
  const { get, find, orderBy } = this.lib._
  const routes = []
  for (const ns of this.app.bajo.pluginNames) {
    const href = get(this, `app.${ns}.config.waibuMpa.home`)
    if (!href) continue
    const item = { href, ns, title: get(this, `app.${ns}.config.waibu.title`, this.app[ns].title) }
    if (!find(routes, { href })) routes.push(item)
  }
  return orderBy(routes, ['title'])
}

function buildPagesMenu (req) {
  const { orderBy } = this.lib._
  const all = [{ icon: 'house', href: '/', level: 1 }]
  for (const ns of this.app.bajo.pluginNames) {
    const items = []
    const pages = this.app[ns].getConfig('waibuMpa.pages', { defValue: [] })
    if (pages.length === 0) continue
    for (const page of pages) {
      if (page.visible === 'auth' && !req.user) continue
      if (page.visible === 'anon' && req.user) continue
      if (!page.children) {
        items.push(page)
        continue
      }
      const children = []
      for (const child of page.children) {
        if (child.visible === 'auth' && !req.user) continue
        if (child.visible === 'anon' && req.user) continue
        children.push(child)
      }
      if (children.length > 0) {
        page.children = children
        items.push(page)
      }
    }
    all.push(...items)
  }
  return orderBy(all, ['level', 'title'])
}
async function buildLocals ({ tpl, params = {}, opts = {} } = {}) {
  const { runHook } = this.app.bajo
  const { set, merge, pick, get, isEmpty, find } = this.lib._
  const { req, reply } = opts

  const appTitle = this.app.waibuMpa ? req.t(this.app.waibuMpa.getAppTitle(req.ns)) : ''
  params.page = merge(params.page ?? {}, { ns: req.ns, appTitle })

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
  _meta.isAdmin = _meta.user && find(_meta.user.teams, { alias: 'administrator' })
  if (params.error) {
    if (params.error.statusCode) _meta.statusCode = params.error.statusCode
    _meta.errorMessage = params.error.message
    if (params.error.ns) {
      params.page.ns = params.error.ns
      params.page.appTitle = this.app.waibuMpa.getAppTitle(params.error.ns)
    }
    this.log.error('error%s', params.error.message)
    if (this.app.bajo.config.env === 'dev') console.log(params.error)
  }
  if (reply && req.session && req.flash && !opts.partial) _meta.flash = reply.flash()
  set(params, 'menu.homes', buildHomesMenu.call(this, req))
  set(params, 'menu.pages', buildPagesMenu.call(this, req))
  const merged = merge({}, params, { _meta })
  await runHook(`${this.name}:afterBuildLocals`, merged, req)
  if (!isEmpty(routeOpts.ns)) await runHook(`${this.name}.${routeOpts.ns}:afterBuildLocals`, merged, req)
  return merged
}

export default buildLocals
