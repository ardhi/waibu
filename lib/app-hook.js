async function appHook () {
  const { runHook } = this.app.bajo
  const hooks = ['onReady', 'onClose', 'preClose', 'onRoute', 'onRegister']
  const me = this
  for (const hook of hooks) {
    me.instance.addHook(hook, async function (...args) {
      if (['onClose', 'onReady'].includes(hook)) await runHook(`${me.name}:${hook}`, ...args)
      else {
        const ctx = this // encapsulated fastify scope
        await runHook(`${me.name}:${hook}`, ctx, ...args)
      }
    })
  }
}

export default appHook
