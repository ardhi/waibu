function getPluginByPrefix (prefix) {
  const { get } = this.app.bajo.lib._
  let plugin
  for (const p of this.app.bajo.pluginNames) {
    if (get(this, `app.${p}.config.waibu.prefix`) === prefix) {
      plugin = this.app[p]
      break
    }
  }
  return plugin
}

export default getPluginByPrefix
