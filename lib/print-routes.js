function printRoutes () {
  const { findIndex, orderBy, isArray } = this.app.lib._
  let items = []
  this.routes.forEach(r => {
    const idx = findIndex(items, { url: r.url })
    if (idx < 0) items.push({ url: r.url, methods: isArray(r.method) ? r.method : [r.method] })
    else {
      if (isArray(r.method)) items[idx].methods.push(...r.method)
      else items[idx].methods.push(r.method)
    }
  })
  items = orderBy(items, ['url'])
  this.log.trace('loaded%s', this.t('routesL'))
  items.forEach(item => {
    this.log.trace('- %s (%s)', item.url, item.methods.join('|'))
  })
}

export default printRoutes
