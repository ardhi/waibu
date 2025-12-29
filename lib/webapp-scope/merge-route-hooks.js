async function mergeRouteHooks (def, withHandler = true) {
  const { last, isFunction } = this.app.lib._
  const { hookTypes } = this.app.baseClass.Waibu
  const hooks = [...hookTypes]
  const me = this
  if (withHandler) hooks.push('handler')
  for (const h of hooks) {
    const oldH = def[h]
    if (!oldH) continue
    def[h] = async function (...args) {
      // TODO: hooks can be array of functions
      if (isFunction(last(args))) args.pop()
      args.push(this)
      return await oldH.call(me, ...args)
    }
  }
}

export default mergeRouteHooks
