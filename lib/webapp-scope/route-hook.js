async function routeHook (ns) {
  const ctx = this.app[ns].instance
  const { runHook } = this.app.bajo
  const { hookTypes } = this.app.wakatobi
  for (const hook of hookTypes) {
    ctx.addHook(hook, async function (...args) {
      const context = this // encapsulated fastify scope
      await runHook(`${ns}:${hook}`, context, ...args)
    })
  }
}

export default routeHook
