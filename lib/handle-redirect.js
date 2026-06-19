import path from 'path'

export function redirect (err = {}, req, reply) {
  if (err.path.startsWith('http') || path.isAbsolute(err.path)) reply.redirect(err.path)
  else reply.redirect(this.routePath(err.path, err.options), err.redirectCode)
  return reply
}

async function handleRedirect (options) {
  const me = this
  this.instance.decorateReply('redirectTo', function (path, options = {}) {
    return redirect.call(me, { path, options }, null, this)
  })
}

export default handleRedirect
