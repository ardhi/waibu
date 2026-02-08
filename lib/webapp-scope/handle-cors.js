import cors from '@fastify/cors'

async function handleCors (options = {}) {
  const { defaultsDeep } = this.app.lib.aneka
  if (options === false) return this.log.warn('middlewareDisabled%s', 'cors')
  const opts = defaultsDeep(options, this.app.waibu.config.cors)
  await this.webAppCtx.register(cors, opts)
}

export default handleCors
