function isIntlPath (ns) {
  const { get } = this.app.bajo.lib._
  return get(this.app[ns], 'config.intl.detectors', []).includes('path')
}

export default isIntlPath
