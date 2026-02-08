import { redirect } from './handle-redirect.js'
import { notFound, writeHtml } from './handle-not-found.js'

async function error (req, reply, err = {}) {
  const { get } = this.app.lib._
  const webApp = get(req, 'routeOptions.config.webApp')
  this.log.error(err)
  if (webApp) {
    const plugin = this.app[webApp]
    const errorHandler = get(plugin, 'waibuFactory.errorHandler')
    if (errorHandler) return await errorHandler.call(plugin, err, req, reply)
  }
  return writeHtml.call(this, req, reply, `${this.ns}:/extend/bajoTemplate/template/500.html`, { text: this.app.log.getErrorMessage(err) })
}

async function handleError () {
  const me = this
  this.instance.setErrorHandler(async function (err, req, reply) {
    if (err.message === '_notFound' || err.statusCode === 404) return await notFound.call(me, req, reply, err)
    if (err.message === '_redirect' && err.redirect) return redirect.call(me, reply, err.redirect, err.options)
    return await error.call(me, req, reply, err)
  })
}

export default handleError
