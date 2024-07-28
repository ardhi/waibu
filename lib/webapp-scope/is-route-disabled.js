function santizeMethods (methods = '*') {
  if (['*', 'all'].includes(methods)) methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  else methods = methods.split(',').map(s => s.trim())
  return methods
}

async function isRouteDisabled (url, method, matchers = []) {
  const { outmatch } = this.app.bajo
  const { intersection, cloneDeep } = this.app.bajo.lib._
  const items = []
  for (const m of cloneDeep(matchers)) {
    m.path = this.app.waibu.routePath(m.path)
    m.methods = santizeMethods(m.methods)
    items.push(m)
  }
  const matcher = items.find(i => {
    const isMatch = outmatch(i.path)
    return isMatch(url)
  })
  if (!matcher) return false
  if (Array.isArray(method)) {
    const result = intersection(method, matcher.methods)
    return result.length > 0
  }
  return matcher.methods.includes(method)
}

export default isRouteDisabled
