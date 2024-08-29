function detect (detector = [], req, reply) {
  const { get, map, trim, orderBy } = this.app.bajo.lib._
  const supported = get(this, 'app.bajoI18N.config.supportedLngs', [this.app.bajo.config.lang])
  const defLang = get(this, 'app.bajoI18N.config.lang', this.app.bajo.config.lang)
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
    reply.redirectTo(url)
    return
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

async function attachI18N (detector = [], req, reply) {
  if (!this.app.bajoI18N) return
  const { get } = this.app.bajo.lib._
  detect.call(this, detector, req, reply)
  const i18n = this.app.bajoI18N.instance.cloneInstance()
  const defNs = get(req, 'routeOptions.config.ns', 'waibu')
  i18n.setDefaultNamespace(defNs)
  await i18n.changeLanguage(req.lang)
  req.i18n = i18n
  req.t = (...args) => {
    return this.app.bajoI18N.t(i18n, ...args)
  }
}

export default attachI18N
