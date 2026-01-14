const errs = {}

async function buildHomesMenu (req) {
  const { callHandler } = this.app.bajo
  const { get, find, orderBy } = this.app.lib._
  const routes = []
  for (const ns of this.app.getAllNs()) {
    let home = get(this, `app.${ns}.config.waibuMpa.home`)
    const homeHandler = get(this, `app.${ns}.config.waibuMpa.homeHandler`)
    if (homeHandler) home = await callHandler(this.app[ns], homeHandler)
    if (!home) continue
    const item = { href: home, ns, title: get(this, `app.${ns}.config.waibu.title`, this.app[ns].title) }
    if (!find(routes, { href: home })) routes.push(item)
  }
  return orderBy(routes, ['title'])
}

async function buildPagesMenu (req) {
  const { find, orderBy, merge, isString } = this.app.lib._
  const { callHandler, runHook } = this.app.bajo
  const all = [{ icon: 'house', href: '/', level: 1 }]
  for (const ns of this.app.getAllNs()) {
    const items = []
    let pages = this.app[ns].getConfig('waibuMpa.menuHandler', { defValue: [] })
    if (isString(pages)) pages = await callHandler(this.app[ns], pages, req)
    if (pages.length === 0) continue
    await runHook(`${this.ns}.${ns}:afterBuildPagesMenu`, pages, req)
    for (const page of pages) {
      const existing = find(all, { title: page.title })
      page.level = page.level ?? 1000
      if (page.visible === 'auth' && !req.user) continue
      if (page.visible === 'anon' && req.user) continue
      if (!page.children) {
        if (existing) merge(existing, page)
        else items.push(page)
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
        if (existing) existing.children.push(...page.children)
        else items.push(page)
      }
    }
    all.push(...items)
  }
  return orderBy(all, ['level', 'title'])
}

async function buildLocals ({ tpl, params = {}, opts = {} } = {}) {
  const { runHook } = this.app.bajo
  const { set, merge, pick, get, isEmpty, find, pullAt } = this.app.lib._
  const { req, reply } = opts
  const appTitle = this.app.waibuMpa ? req.t(this.app.waibuMpa.getAppTitle(req.ns)) : ''
  params.page = merge(params.page ?? {}, { ns: req.ns, appTitle })
  params.sidebar = params.sidebar ?? []

  const { site, user, lang, darkMode } = req
  const theme = pick(find(this.themes, { name: opts.theme ?? req.theme }) ?? {}, ['name', 'framework'])
  const iconset = pick(find(this.iconsets, { name: opts.iconset ?? req.iconset }) ?? {}, ['name'])
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
  const pulled = []
  for (const k in errs) {
    if (Date.now() - errs[k] > 5000) pulled.push(k)
  }
  pullAt(errs, pulled)
  if (params.error) {
    if (params.error.statusCode) _meta.statusCode = params.error.statusCode
    _meta.errorMessage = params.error.message
    if (params.error.ns) {
      params.page.ns = params.error.ns
      params.page.appTitle = this.app.waibuMpa.getAppTitle(params.error.ns)
    }
    if (!errs[req.id]) {
      this.log.error('error%s', params.error.message)
      if (this.app.bajo.config.env === 'dev') console.log(params.error)
    }
    errs[req.id] = Date.now()
  }
  if (reply && req.session && req.flash && !opts.partial) _meta.flash = reply.flash()
  set(params, 'menu.homes', await buildHomesMenu.call(this, req))
  set(params, 'menu.pages', await buildPagesMenu.call(this, req))
  const merged = merge({}, params, { _meta })
  await runHook(`${this.ns}:afterBuildLocals`, merged, req)
  if (!isEmpty(routeOpts.ns)) await runHook(`${this.ns}.${routeOpts.ns}:afterBuildLocals`, merged, req)
  return merged
}

export default buildLocals
