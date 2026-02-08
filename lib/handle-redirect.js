import path from 'path'

export function redirect (reply, url, options = {}) {
  if (url.startsWith('http') || path.isAbsolute(url)) reply.redirect(url)
  else reply.redirect(this.routePath(url, options))
  return reply
}

async function handleRedirect (options) {
  const me = this
  this.instance.decorateReply('redirectTo', function (url, options = {}) {
    return redirect.call(me, this, url, options)
  })
}

export default handleRedirect
