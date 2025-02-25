import cors from '@fastify/cors'

async function handleCors (ctx, options = {}) {
  const { defaultsDeep } = this.app.bajo
  if (options === false) return this.log.warn('middlewareDisabled%s', 'cors')
  const opts = defaultsDeep(options, this.app.waibu.config.cors)
  await ctx.register(cors, opts)
}

export default handleCors
