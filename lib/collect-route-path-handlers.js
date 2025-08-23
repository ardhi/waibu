async function collectRoutePathHandlers () {
  const { eachPlugins } = this.app.bajo
  const { isEmpty } = this.lib._
  this.routePathHandlers = this.routePathHandlers ?? {}
  const me = this

  await eachPlugins(async function () {
    const { name: ns } = this
    if (isEmpty(this.routePathHandlers) || !this.routePath) return undefined
    for (const key of this.routePathHandlers) {
      me.routePathHandlers[key] = { handler: this.routePath, ns }
    }
  })
}

export default collectRoutePathHandlers
