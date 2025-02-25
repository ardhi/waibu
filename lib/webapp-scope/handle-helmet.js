import helmet from '@fastify/helmet'

async function handleHelmet (ctx, options = {}) {
  const { defaultsDeep } = this.app.bajo
  if (options === false) return this.log.warn('middlewareDisabled%s', 'helmet')
  const opts = defaultsDeep(options, this.app.waibu.config.helmet)
  await ctx.register(helmet, opts)
}

export default handleHelmet
