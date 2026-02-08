import helmet from '@fastify/helmet'

async function handleHelmet (options = {}) {
  const { defaultsDeep } = this.app.lib.aneka
  if (options === false) return this.log.warn('middlewareDisabled%s', 'helmet')
  const opts = defaultsDeep(options, this.app.waibu.config.helmet)
  await this.webAppCtx.register(helmet, opts)
}

export default handleHelmet
