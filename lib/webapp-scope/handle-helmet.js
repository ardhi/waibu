import helmet from '@fastify/helmet'

async function handleHelmet (ctx, options = {}) {
  if (!options) return
  await ctx.register(helmet, options)
}

export default handleHelmet
