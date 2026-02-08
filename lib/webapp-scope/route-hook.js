async function routeHook (ns) {
  const webAppCtx = ns === 'waibu' ? this.app.waibu.instance : this.app[ns].webAppCtx
  const { runHook } = this.app.bajo
  const { hookTypes } = this.app.baseClass.Waibu
  for (const hook of hookTypes) {
    webAppCtx.addHook(hook, async function (...args) {
      args.push(this)
      await runHook(`${ns}:${hook}`, ...args)
    })
  }
}

export default routeHook
