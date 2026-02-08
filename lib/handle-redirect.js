import path from 'path'

export function redirect (err = {}, req, reply) {
  if (err.redirect.startsWith('http') || path.isAbsolute(err.redirect)) reply.redirect(err.redirect)
  else reply.redirect(this.routePath(err.redirect, err.options))
  return reply
}

async function handleRedirect (options) {
  const me = this
  this.instance.decorateReply('redirectTo', function (url, options = {}) {
    return redirect.call(me, { redirect: url, options }, null, this, url, options)
  })
}

export default handleRedirect
