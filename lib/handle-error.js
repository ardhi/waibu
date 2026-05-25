import { redirect } from './handle-redirect.js'
import { notFound, writeHtml, interceptor } from './handle-not-found.js'

async function error (err, req, reply) {
  this.log.error(err)
  const resp = await interceptor.call(this, 'errorHandler', err, req, reply)
  if (resp) return resp
  const payload = {
    text: this.app.log.getErrorMessage(err),
    title: req.t('internalServerError')
  }
  return writeHtml.call(this, req, reply, `${this.ns}:/lib/template/500.html`, payload)
}

async function handleError () {
  const me = this
  this.instance.setErrorHandler(async function (err, req, reply) {
    if (err.message === '_notFound' || err.statusCode === 404) return await notFound.call(me, err, req, reply)
    if (err.message === '_redirect' && err.redirect) return redirect.call(me, err, req, reply)
    return await error.call(me, err, req, reply)
  })
}

export default handleError
