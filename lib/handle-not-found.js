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

export async function interceptor (err, name, req, reply) {
  const { get } = this.app.lib._
  const webApp = get(req, 'routeOptions.config.webApp')
  if (webApp) {
    const plugin = this.app[webApp]
    const handler = get(plugin, `waibuFactory.${name}`)
    if (handler) return await handler.call(plugin, err, req, reply)
  }
}

function redirSvc (req) {
  const { trim, find, get } = this.app.lib._
  const { outmatch } = this.app.lib
  let match = false
  let [prefix, ...args] = trim(req.url, '/').split('/')
  args = '/' + args.join('/')
  let plugin = find(this.app.getAllNs(), p => {
    return get(this, `app.${p}.config.waibu.prefix`) === prefix
  })
  if (!plugin) {
    plugin = 'main'
    args = `/${prefix}`
  }
  const items = get(this, `app.${plugin}.config.waibuMpa.redirect`, {})
  for (const k in items) {
    const isMatch = outmatch(k)
    if (isMatch(args)) {
      match = items[k]
      break
    }
  }
  return match
}

export async function notFound (err, req, reply) {
  const { getMethod } = this.app.bajo
  let redirectTo = await redirSvc.call(this, req, reply)
  if (redirectTo !== false) {
    const fn = getMethod(redirectTo, false)
    if (fn) redirectTo = await fn(req)
    if (redirectTo) return reply.redirectTo(redirectTo)
  }
  reply.code(404)
  const resp = await interceptor.call(this, 'notFoundHandler', err, req, reply)
  if (resp) return resp
  const text = req.t('notFound%s%s', req.t('route'), req.url)
  return writeHtml.call(this, req, reply, `${this.ns}:/extend/bajoTemplate/template/400.html`, { text })
}

async function handleNotFound () {
  const me = this
  me.instance.setNotFoundHandler(async function (req, reply) {
    return await notFound.call(me, null, req, reply)
  })
}

export default handleNotFound
