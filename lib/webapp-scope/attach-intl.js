function detect (detector = [], req, reply) {
  const { get, map, trim, orderBy } = this.lib._
  const supported = get(this, 'app.bajo.config.intl.supported', [this.app.bajo.config.lang])
  const defLang = get(this, 'app.bajo.config.intl.fallback', this.app.bajo.config.lang)
  let lang = null
  // by route path
  if (detector.includes('path')) {
    lang = req.params.lang
    if (lang && supported.includes(lang)) {
      req.lang = lang
      req.langDetector = 'path'
      return
    }
    const length = req.url.split('/').length
    let url = req.url.replace(`/${lang}`, `/${defLang}`)
    if (length > 2) url = req.url.replace(`/${lang}/`, `/${defLang}/`)
    return reply.redirectTo(url)
  }
  // by query string
  lang = null
  if (detector.includes('qs')) {
    lang = req.query[this.app.waibu.config.qsKey.lang]
    if (lang && supported.includes(lang)) {
      req.lang = lang
      req.langDetector = 'qs'
      return
    }
  }
  // by header
  if (detector.includes('header')) {
    lang = null
    const accepteds = orderBy(map((req.headers['accept-language'] || '').split(','), a => {
      const [name, qty] = trim(a || '').split(';').map(i => trim(i))
      return { name, qty: parseFloat((qty || '').split('=')[1]) || 1 }
    }), ['qty'], ['desc'])
    for (const a of accepteds) {
      if (supported.includes(a.name)) {
        lang = a.name
        break
      }
    }
    if (lang) {
      req.lang = lang
      req.langDetector = 'header'
      return
    }
  }
  req.lang = lang ?? defLang
}

async function attachIntl (detector = [], req, reply) {
  const { get } = this.lib._
  detect.call(this, detector, req, reply)
  const defNs = get(req, 'routeOptions.config.ns', this.name)
  req.t = (text, ...args) => {
    args.push({ lang: req.lang })
    return this.app[defNs].print.write(text, ...args)
  }
  req.format = (value, type = 'auto', opts = {}) => {
    opts.lang = opts.lang ?? req.lang
    return this.app.bajo.format(value, type, opts)
  }
}

export default attachIntl
