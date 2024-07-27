import replyFrom from '@fastify/reply-from'

async function handleForward (ctx) {
  const { defaultsDeep } = this.app.bajo
  const me = this

  function rewriteHeaders (headers, req) {
    return {
      ...headers,
      'X-Fwd-To': true
    }
  }

  const base = `http://${this.config.server.host}:${this.config.server.port}`
  const options = defaultsDeep({ base }, this.config.forwardOpts)
  await ctx.register(replyFrom, options)

  await ctx.decorateReply('forwardTo', async function (url, options = {}) {
    if (url.startsWith('http')) return await me.redirectTo(url)
    return this.from(me.routePath(url, options), {
      rewriteHeaders
    })
  })
}

export default handleForward
