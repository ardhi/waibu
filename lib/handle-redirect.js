import path from 'path'

async function handleRedirect (ctx, options) {
  const me = this
  ctx.decorateReply('redirectTo', function (url, options = {}) {
    if (url.startsWith('http') || path.isAbsolute(url)) this.redirect(url)
    else this.redirect(me.routePath(url, options))
    return this
  })
}

export default handleRedirect
