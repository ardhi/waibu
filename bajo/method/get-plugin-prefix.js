function getPluginPrefix (base) {
  const { get, trim } = this.app.bajo.lib._
  const prefix = get(this, `app.${base}.config.waibu.prefix`, this.app[base].alias)
  return trim(prefix, '/')
}

export default getPluginPrefix
