import compress from '@fastify/compress'

async function handleCompress (ctx, options = {}) {
  if (!options) return
  await ctx.register(compress, options)
}

export default handleCompress
