import home from './home.js'

export async function collect (glob = 'boot.js', baseNs) {
  const { eachPlugins, importModule } = this.app.bajo
  const { orderBy } = this.app.bajo.lib._
  if (!baseNs) baseNs = this.name
  const mods = []
  await eachPlugins(async function ({ config, file, ns, alias }) {
    const mod = await importModule(file, { asHandler: true })
    mod.prefix = config.prefix ?? alias
    mod.ns = ns
    mods.push(mod)
  }, { glob, baseNs })
  const prefixes = {}
  mods.forEach(m => {
    if (!prefixes[m.prefix]) prefixes[m.prefix] = []
    prefixes[m.prefix].push(m.plugin)
    if (prefixes[m.prefix].length > 1) this.fatal('Plugin prefix \'%s\' conflic between \'%s\' and \'%s\'', m.prefix, prefixes[m.prefix][0], prefixes[m.prefix][1])
  })
  return orderBy(mods, ['level'])
}

export async function boot () {
  const { runHook } = this.app.bajo
  const mods = await collect.call(this)
  await runHook(`${this.name}:beforeAppBoot`)
  for (const m of mods) {
    await runHook(`${this.name}.${m.ns}:beforeAppBoot`)
    this.log.debug('Boot app: %s', m.ns)
    await m.handler.call(this.app[m.ns])
    await runHook(`${this.name}.${m.ns}:afterAppBoot`)
  }
  await runHook(`${this.name}:afterAppBoot`)
  await home.call(this)
}
