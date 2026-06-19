async function decorate () {
  const me = this
  this.instance.decorateRequest('lang', null)
  this.instance.decorateRequest('t', () => {})
  this.instance.decorateRequest('te', () => {})
  this.instance.decorateRequest('format', () => {})
  this.instance.decorateRequest('langDetector', null)
  this.instance.decorateRequest('site', null)
  this.instance.decorateRequest('ns', null)
  this.instance.decorateRequest('getSetting', function (key, defValue) {
    return me.app.waibu.getSetting(key, { req: this, defValue })
  })
}

export default decorate
