async function reroutedPath (path, mapper = {}) {
  const { routePath } = this.app.waibu
  let result
  for (let k in mapper) {
    const v = routePath(mapper[k])
    k = routePath(k)
    if (k === path) result = v
  }
  return result
}

export default reroutedPath
