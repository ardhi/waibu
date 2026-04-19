async function decorate () {
  const { isPlainObject, isArray } = this.app.lib._
  const { defaultsDeep } = this.app.lib.aneka
  const me = this
  this.instance.decorateRequest('lang', null)
  this.instance.decorateRequest('t', () => {})
  this.instance.decorateRequest('format', () => {})
  this.instance.decorateRequest('langDetector', null)
  this.instance.decorateRequest('site', null)
  this.instance.decorateRequest('ns', null)
  this.instance.decorateRequest('getSetting', function (key, defValue) {
    const value = me.app.waibu.getSetting(key, { req: this })
    if (isPlainObject(value) || isArray(value)) return defaultsDeep({}, value, defValue)
    return value ?? defValue
  })
}

export default decorate
