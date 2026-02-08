import rateLimit from '@fastify/rate-limit'

async function handleRateLimit (options = {}) {
  const { cloneDeep } = this.app.lib._
  const { defaultsDeep } = this.app.lib.aneka
  if (options === false) return this.log.warn('middlewareDisabled%s', 'rateLimit')
  const opts = defaultsDeep(options, this.app.waibu.config.rateLimit)
  await this.webAppCtx.register(rateLimit, cloneDeep(opts))
}

export default handleRateLimit
