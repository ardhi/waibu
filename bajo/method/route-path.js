function routePath (name = '', { query = {}, base = 'waibuMpa', params = {} } = {}) {
  const { defaultsDeep, getPlugin } = this.app.bajo
  const { isEmpty, get } = this.app.bajo.lib._
  const { breakNsPath } = this.app.bajo

  const plugin = getPlugin(base)
  const cfg = plugin.config ?? {}
  let ns
  let subNs
  let fullPath
  if (['/', '?', '#'].includes(name.slice(0, 1))) fullPath = name
  else [ns, fullPath, subNs] = breakNsPath(name)
  if (fullPath.includes('//')) return fullPath
  if (subNs === 'virtual') return `${this.app.waibuStatic.virtualDir(ns)}${fullPath}`
  if (subNs === 'asset') return `${this.app.waibuStatic.assetDir(ns)}${fullPath}`
  let [path, queryString] = fullPath.split('?')

  path = path.split('/').map(p => {
    return p[0] === ':' && params[p.slice(1)] ? params[p.slice(1)] : p
  }).join('/')
  let url = path
  const langDetector = get(cfg, 'i18n.detectors', [])
  if (ns) url = langDetector.includes('path') ? `/${params.lang ?? ''}${this.routeDir(ns)}${path}` : `${this.routeDir(ns)}${path}`
  queryString = defaultsDeep(query, this.qs.parse(queryString))
  if (!isEmpty(queryString)) url += '?' + this.qs.stringify(queryString)
  return url
}

export default routePath
