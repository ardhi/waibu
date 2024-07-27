async function errorHandler (ctx, extHandler) {
  const me = this
  ctx.setErrorHandler(async function (err, req, reply) {
    if (err.redirect) {
      reply.redirect(err.redirect)
      return
    }
    if (err.print) {
      reply.send(err.print)
      return
    }
    if (me.app.bajo.config.log.level === 'trace' && !['notfound', 'redirect'].includes(err.message)) console.error(err)
    if (extHandler) return await extHandler.call(me, ctx, err, req, reply)
    if (err.message === 'notfound' || err.statusCode === 404) {
      reply.code(err.statusCode)
      return
    }
    reply.code(err.statusCode ?? 500)
  })
}

export default errorHandler
