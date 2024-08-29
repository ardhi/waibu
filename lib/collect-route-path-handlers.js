async function collectRoutePathHandlers () {
  const { eachPlugins } = this.app.bajo
  const { isEmpty } = this.app.bajo.lib._
  this.routePathHandlers = this.routePathHandlers ?? {}
  const me = this

  await eachPlugins(async function ({ alias }) {
    if (isEmpty(this.config.routePathHandlers) || !this.routePath) return undefined
    for (const key of this.config.routePathHandlers) {
      me.routePathHandlers[key] = this.routePath
    }
  })
}

export default collectRoutePathHandlers