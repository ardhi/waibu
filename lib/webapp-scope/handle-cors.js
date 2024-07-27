import cors from '@fastify/cors'

async function handleCors (ctx, options = {}) {
  if (!options) return
  await ctx.register(cors, options)
}

export default handleCors
