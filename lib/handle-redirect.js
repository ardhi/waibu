import path from 'path'

async function handleRedirect (ctx, options) {
  const me = this
  ctx.decorateReply('redirectTo', async function (url, options = {}) {
    if (url.startsWith('http') || path.isAbsolute(url)) return this.redirect(url)
    return this.redirect(me.routePath(url, options))
  })
}

export default handleRedirect
