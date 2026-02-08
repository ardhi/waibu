import path from 'path'
import handleDownload from './handle-download.js'

async function handleFavicon () {
  const { getPluginFile } = this.app.bajo
  let file
  let ext = '.ico'
  if (this.config.favicon) {
    file = getPluginFile(this.config.favicon === true ? 'main:/favicon.ico' : this.config.favicon)
    ext = path.extname(file)
  }
  const me = this
  this.instance.get(`/favicon${ext}`, async function (req, reply) {
    if (!file) return reply.code(404).send()
    reply.header('cache-control', 'max-age=86400')
    return await handleDownload.call(me, file, req, reply)
  })
}

export default handleFavicon
