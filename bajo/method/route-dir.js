function routeDir (ns, base) {
  if (!base) base = ns
  const cfg = this.app[base].config
  const dir = cfg.prefix === '' ? '' : `/${cfg.prefix || this.app[base].alias}`
  if (!ns) return dir
  if (ns === base || (ns === this.app.bajo.mainNs && cfg.mountAppAsRoot)) return dir
  return dir + '/' + this.app[ns].alias
}

export default routeDir
