import multipart from '@fastify/multipart'
import { promisify } from 'util'
import { pipeline } from 'stream'
import { normalizeValue } from '../handle-body.js'
import path from 'path'
const pump = promisify(pipeline)

async function onFileHandler () {
  const { getPluginDataDir } = this.app.bajo
  const { fs } = this.app.lib
  const dir = `${getPluginDataDir('waibu')}/upload`
  return async function (part) {
    // 'this' is the fastify context here
    const filePath = `${dir}/${this.id}/${part.fieldname}@${part.filename}`
    await fs.ensureDir(path.dirname(filePath))
    await pump(part.file, fs.createWriteStream(filePath))
  }
}

async function handleMultipartBody (options = {}) {
  const { defaultsDeep } = this.app.lib.aneka
  const { isArray, map, isEmpty } = this.app.lib._
  const me = this

  if (options === false) return this.log.warn('middlewareDisabled%s', 'multipart')
  const opts = defaultsDeep(options, this.app.waibu.config.multipart)
  const onFile = await onFileHandler.call(this)
  opts.onFile = onFile
  await this.webAppCtx.register(multipart, opts)

  this.webAppCtx.addHook('preValidation', async function (req, reply) {
    if (req.isMultipart() && opts.attachFieldsToBody === true) {
      const body = Object.fromEntries(
        Object.keys(req.body || {}).map((key) => {
          let item = req.body[key]
          let value
          if (key.endsWith('[]') && !isArray(item)) item = [item]
          if (isArray(item)) {
            value = map(item, i => normalizeValue.call(me, i.value))
          } else {
            value = normalizeValue.call(me, item.value)
          }
          key = key.replace('[]', '')
          return [key, value]
        })
      )
      const newBody = {}
      for (const k in body) {
        if (isEmpty(k)) continue
        newBody[k] = body[k]
      }
      req.body = newBody
    }
  })
}

export default handleMultipartBody
