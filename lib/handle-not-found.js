export function writeHtml (req, reply, tpl, payload) {
  const { fs } = this.app.lib
  const { template } = this.app.lib._
  reply.header('Content-Type', 'text/html')
  reply.header('Content-Language', req.lang)
  const file = this.app.getPluginFile(tpl)
  const content = fs.readFileSync(file, 'utf8')
  const compiled = template(content)
  return compiled(payload)
}

export async function interceptor (name, err, req, reply) {
  const { get, trim } = this.app.lib._
  let webApp = get(req, 'routeOptions.config.webApp')
  const all = this.webApps.map(item => item.ns)
  if (!webApp) {
    const url = req.url ?? req.raw.url
    const [prefix] = trim(url, '/').split('/')
    const ns = this.getPluginByPrefix(prefix, true)
    if (all.includes(ns)) webApp = ns
  }
  if (!webApp) {
    const wa = this.webApps.find(item => item.prefix === '')
    if (wa) webApp = wa.ns
  }
  if (webApp) {
    const plugin = this.app[webApp]
    const handler = get(plugin, `webAppFactory.${name}`)
    if (handler) return await handler.call(plugin, err, req, reply)
  }
}

function redirSvc (req) {
  const { trim, get } = this.app.lib._
  const { outmatch } = this.app.lib

  const matchRoute = (path, items) => {
    let match = false
    for (const k in items) {
      const isMatch = outmatch(k)
      if (isMatch(path)) {
        match = items[k]
        const parts = path.split('/')
        const patterns = k.split('/')
        for (const idx in patterns) {
          if (patterns[idx] === '*') match = match.replace(`{${idx}}`, parts[idx])
        }
        break
      }
    }
    return match
  }

  const [prefix, subPrefix, ...args] = trim(req.url.split('?')[0].split('#')[0], '/').split('/')
  let plugin = this.getPluginByPrefix(prefix)
  const subPlugin = this.getPluginByPrefix(subPrefix)
  if (!plugin && !subPlugin) plugin = this.app.main
  let route = false
  if (plugin && subPlugin) {
    const items = get(this, `app.${subPlugin.ns}.config.waibuMpa.redirectSubRoute.${plugin.ns}`, {})
    route = matchRoute(`/${args.join('/')}`, items)
    if (route) return route
  }
  if (plugin) {
    const items = get(this, `app.${plugin.ns}.config.waibuMpa.redirect`, {})
    route = matchRoute(subPrefix ? `/${subPrefix}/${args.join('/')}` : '/', items)
    if (route) return route
  }
  return route
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
  if (err && err.noContent) return ''
  const payload = {
    text: req.t('notFound%s%s', req.t('route'), req.url),
    title: req.t('pageNotFound')
  }
  return writeHtml.call(this, req, reply, `${this.ns}:/lib/template/404.html`, payload)
}

async function handleNotFound () {
  const me = this
  me.instance.setNotFoundHandler(async function (req, reply) {
    return await notFound.call(me, null, req, reply)
  })
}

export default handleNotFound
