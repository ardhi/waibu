const waibuPreParsing = {
  level: 9,
  handler: async function (req, reply) {
    const { importModule } = this.app.bajo
    const attachIntl = await importModule('waibu:/lib/webapp-scope/attach-intl.js')
    await attachIntl.call(this, this.config.intl.detectors, req, reply)
  }
}

export default waibuPreParsing
