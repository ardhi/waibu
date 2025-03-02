function routePath (name = '', { query = {}, base = 'waibuMpa', params = {}, guessHost } = {}) {
  const { defaultsDeep, getPlugin } = this.app.bajo
  const { isEmpty, get, trimEnd, trimStart } = this.app.bajo.lib._
  const { breakNsPath } = this.app.bajo

  const plugin = getPlugin(base)
  const cfg = plugin.config ?? {}
  let info = {}
  if (name.startsWith('mailto:') || name.startsWith('tel:')) return name
  if (['%', '.', '/', '?', '#'].includes(name[0]) || name.slice(1, 2) === ':') info.path = name
  else if (['~'].includes(name[0])) info.path = name.slice(1)
  else {
    info = breakNsPath(name)
  }
  if (info.path.slice(0, 2) === './') info.path = info.path.slice(2)
  if (this.routePathHandlers[info.subNs]) return this.routePathHandlers[info.subNs](name)
  if (info.path.includes('//')) return info.path

  info.path = info.path.split('/').map(p => {
    return p[0] === ':' && params[p.slice(1)] ? params[p.slice(1)] : p
  }).join('/')
  let url = info.path
  const langDetector = get(cfg, 'intl.detectors', [])
  if (info.ns) url = trimEnd(langDetector.includes('path') ? `/${params.lang ?? ''}${this.routeDir(info.ns)}${info.path}` : `${this.routeDir(info.ns)}${info.path}`, '/')
  info.qs = defaultsDeep({}, query, info.qs)
  if (!isEmpty(info.qs)) url += '?' + this.qs.stringify(info.qs)
  if (!url.startsWith('http') && guessHost) url = `http://${this.config.server.host}:${this.config.server.port}/${trimStart(url, '/')}`
  return url
}

export default routePath
