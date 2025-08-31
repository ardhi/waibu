import replyFrom from '@fastify/reply-from'

async function handleForward (ctx) {
  const { defaultsDeep } = this.app.lib.aneka
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

  ctx.decorateReply('forwardTo', function (url, options = {}) {
    if (url.startsWith('http')) return this.redirectTo(url)
    this.from(me.routePath(url, options), {
      rewriteHeaders
    })
    return this
  })
}

export default handleForward
