import compress from '@fastify/compress'

async function handleCompress (options = {}) {
  const { defaultsDeep } = this.app.lib.aneka
  if (options === false) return this.log.warn('middlewareDisabled%s', 'compress')
  const opts = defaultsDeep(options, this.app.waibu.config.compress)
  await this.webAppCtx.register(compress, opts)
}

export default handleCompress
