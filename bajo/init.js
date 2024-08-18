import collectRoutePathHandlers from '../lib/collect-route-path-handlers.js'

async function init () {
  if (this.config.home === '/') this.config.home = false
  await collectRoutePathHandlers.call(this)
}

export default init
