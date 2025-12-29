import path from 'path'

async function handleDownload (input, req, reply) {
  const { importPkg } = this.app.bajo
  const { isFunction } = this.app.lib._
  const mime = await importPkg('waibu:mime')
  const { fs } = this.app.lib
  const file = isFunction(input) ? (await input.call(this, req)) : input
  if (!fs.existsSync(file)) throw this.error('_notFound')
  const mimeType = mime.getType(path.extname(file))
  reply.header('Content-Type', mimeType)
  const stream = fs.createReadStream(file)
  reply.send(stream)
  return reply
}

export default handleDownload
