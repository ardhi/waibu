import hookTypes from './hook-types.js'

async function mergeRouteHooks (def, withHandler = true) {
  const { last, isFunction } = this.app.bajo.lib._
  const hooks = [...hookTypes]
  const me = this
  if (withHandler) hooks.push('handler')
  for (const h of hooks) {
    const oldH = def[h]
    if (!oldH) continue
    def[h] = async function (...args) {
      // TODO: hooks can be array of functions
      if (isFunction(last(args))) args.pop()
      return await oldH.call(me, this, ...args)
    }
  }
}

export default mergeRouteHooks
