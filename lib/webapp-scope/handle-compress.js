import compress from '@fastify/compress'

async function handleCompress (ctx, options = {}) {
  const { defaultsDeep } = this.lib.aneka
  if (options === false) return this.log.warn('middlewareDisabled%s', 'compress')
  const opts = defaultsDeep(options, this.app.waibu.config.compress)
  await ctx.register(compress, opts)
}

export default handleCompress
