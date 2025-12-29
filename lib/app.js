import home from './home.js'

export async function collect (glob = 'boot.js', baseNs) {
  const { eachPlugins, importModule } = this.app.bajo
  const { orderBy, get } = this.app.lib._
  if (!baseNs) baseNs = this.ns
  const mods = []

  await eachPlugins(async function ({ file }) {
    const { ns, alias, config } = this
    const mod = await importModule(file, { asHandler: true })
    mod.prefix = get(config, 'waibu.prefix', alias)
    if (get(config, 'intl.detectors', []).includes('path')) mod.prefix = `/:lang${mod.prefix}`
    mod.ns = ns
    mod.alias = alias
    mods.push(mod)
  }, { glob, prefix: baseNs })
  const prefixes = {}
  mods.forEach(m => {
    if (!prefixes[m.prefix]) prefixes[m.prefix] = []
    prefixes[m.prefix].push(m.plugin)
    if (prefixes[m.prefix].length > 1) this.fatal('pluginPrefixConflic%s%s%s', m.prefix, prefixes[m.prefix][0], prefixes[m.prefix][1])
  })
  return orderBy(mods, ['level'])
}

export async function boot () {
  const { runHook } = this.app.bajo
  const mods = await collect.call(this)
  await runHook(`${this.ns}:beforeAppBoot`)
  for (const m of mods) {
    const disabled = this.app[m.ns].config.disabled
    if (Array.isArray(disabled) && disabled.length === 1 && ['*', 'all'].includes(disabled[0])) {
      this.log.warn('allRoutesConfigDisabled%s', m.ns)
      continue
    }
    await runHook(`${this.ns}.${m.ns}:beforeAppBoot`)
    this.log.debug('bootApp%s', m.ns)
    await this.instance.register(async (ctx) => {
      const plugin = this.app[m.ns]
      plugin.instance = ctx
      await runHook(`${plugin.ns}:afterCreateContext`, ctx)
      await m.handler.call(plugin, ctx, m.prefix)
    }, { prefix: m.prefix })
    await runHook(`${this.ns}.${m.ns}:afterAppBoot`)
  }
  await runHook(`${this.ns}:afterAppBoot`)
  await home.call(this)
}
