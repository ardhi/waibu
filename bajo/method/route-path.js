import qs from 'querystring'

function routePath (name, { query = {}, base = 'wakatobiMpa', params = {} } = {}) {
  // TODO: what if wakatobiMpa isn't loaded?
  const { defaultsDeep } = this.app.bajo
  const { isEmpty, get } = this.app.bajo.lib._
  const { breakNsPath } = this.app.bajo
  const cfg = this.app[base].config ?? {}
  let ns
  let fullPath
  if (name.startsWith('/')) fullPath = name
  else [ns, fullPath] = breakNsPath(name)
  let [path, queryString] = fullPath.split('?')
  path = path.split('/').map(p => {
    return p[0] === ':' && params[p.slice(1)] ? params[p.slice(1)] : p
  }).join('/')
  let url = path
  const langDetector = get(cfg, 'i18n.detectors', [])
  if (ns) url = langDetector.includes('path') ? `/${params.lang ?? ''}${this.routeDir(ns)}${path}` : `${this.routeDir(ns)}${path}`
  queryString = defaultsDeep(query, qs.parse(queryString))
  if (!isEmpty(queryString)) url += '?' + qs.stringify(queryString)
  return url
}

export default routePath
