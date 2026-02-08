export function writeHtml (req, reply, tpl, payload) {
  const { getPluginFile } = this.app.bajo
  const { fs } = this.app.lib
  const { template } = this.app.lib._
  reply.header('Content-Type', 'text/html')
  reply.header('Content-Language', req.lang)
  const file = getPluginFile(tpl)
  const content = fs.readFileSync(file)
  const compiled = template(content)
  return compiled(payload)
}

export async function notFound (req, reply, err = {}) {
  const { get } = this.app.lib._
  const webApp = get(req, 'routeOptions.config.webApp')
  reply.code(404)
  if (webApp) {
    const plugin = this.app[webApp]
    const errorHandler = get(plugin, 'waibuFactory.errorHandler')
    if (errorHandler) return await errorHandler.call(plugin, req, reply)
  }
  const text = req.t('notFound%s%s', req.t('route'), req.url)
  return writeHtml.call(this, req, reply, `${this.ns}:/extend/bajoTemplate/template/400.html`, { text })
}

async function handleNotFound () {
  const me = this
  me.instance.setNotFoundHandler(async function (req, reply) {
    return await notFound.call(me, req, reply)
  })
}

export default handleNotFound
