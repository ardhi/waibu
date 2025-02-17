function getPluginPrefix (base, webApp = 'waibuMpa') {
  const { get, trim } = this.app.bajo.lib._
  let prefix = get(this, `app.${base}.config.waibu.prefix`, this.app[base].alias)
  if (base === 'main') {
    const cfg = this.app[webApp].config
    if (cfg.mountMainAsRoot) prefix = ''
  }

  return trim(prefix, '/')
}

export default getPluginPrefix
