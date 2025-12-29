async function routeHook (ns) {
  const ctx = this.app[ns].instance
  const { runHook } = this.app.bajo
  const { hookTypes } = this.app.baseClass.Waibu
  for (const hook of hookTypes) {
    ctx.addHook(hook, async function (...args) {
      args.push(this)
      await runHook(`${ns}:${hook}`, ...args)
    })
  }
}

export default routeHook
