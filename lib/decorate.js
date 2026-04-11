async function decorate () {
  const { get } = this.app.lib._
  const { breakNsPath } = this.app.bajo
  const me = this
  this.instance.decorateRequest('lang', null)
  this.instance.decorateRequest('t', () => {})
  this.instance.decorateRequest('format', () => {})
  this.instance.decorateRequest('langDetector', null)
  this.instance.decorateRequest('site', null)
  this.instance.decorateRequest('ns', null)
  this.instance.decorateRequest('getSetting', function (key, defValue) {
    let { ns, path } = breakNsPath(key)
    const paths = path.replaceAll('/', '.').split('.')
    if (paths[0] === '') paths.shift()
    path = paths.join('.')
    const cfgValue = get(me.app, `${ns}.config.${path}`, defValue)
    return get(this, `site.setting.${ns}.${path}`, cfgValue)
  })
}

export default decorate
