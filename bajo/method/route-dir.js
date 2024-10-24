function routeDir (ns, base) {
  const { get } = this.app.bajo.lib._
  if (!base) base = ns
  const cfg = this.app[base].config
  const prefix = get(cfg, 'waibu.prefix', this.app[base].alias)
  const dir = prefix === '' ? '' : `/${prefix}`
  if (!ns) return dir
  if (ns === base || (ns === this.app.bajo.mainNs && cfg.mountMainAsRoot)) return dir
  return dir + `/${get(this.app[ns].config, 'waibu.prefix', this.app[ns].alias)}`
}

export default routeDir
