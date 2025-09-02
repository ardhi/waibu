async function appHook () {
  const { runHook } = this.app.bajo
  const hooks = ['onReady', 'onClose', 'preClose', 'onRoute', 'onRegister']
  const me = this
  for (const hook of hooks) {
    me.instance.addHook(hook, async function (...args) {
      args.push(this)
      if (['onClose', 'onReady'].includes(hook)) await runHook(`${me.ns}:${hook}`, ...args)
      else await runHook(`${me.ns}:${hook}`, ...args)
    })
  }
}

export default appHook
