import multipart from '@fastify/multipart'
import { promisify } from 'util'
import { pipeline } from 'stream'
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

async function handleMultipartBody (ctx, options = {}) {
  const { importPkg } = this.app.bajo
  const { defaultsDeep, isSet } = this.app.lib.aneka
  const { isArray, map, trim, isPlainObject, isEmpty } = this.app.lib._
  const parseVar = await importPkg('bajo:dotenv-parse-variables')
  if (options === false) return this.log.warn('middlewareDisabled%s', 'multipart')
  const opts = defaultsDeep(options, this.app.waibu.config.multipart)
  const onFile = await onFileHandler.call(this)
  opts.onFile = onFile
  await ctx.register(multipart, opts)

  function normalizeValue (value) {
    if (!isSet(value)) return
    if (value === 'null') value = null
    else if (value === 'undefined') value = undefined
    else {
      const val = trim(value)
      if (['{', '['].includes(val[0])) {
        try {
          const parsed = JSON.parse(val)
          if (isPlainObject(parsed) || isArray(parsed)) value = parsed
        } catch (err) {
          value = val
        }
      } else value = parseVar({ item: value }).item
    }
    return value
  }

  ctx.addHook('preValidation', async function (req, reply) {
    if (req.isMultipart() && opts.attachFieldsToBody === true) {
      const body = Object.fromEntries(
        Object.keys(req.body || {}).map((key) => {
          let item = req.body[key]
          let value
          if (key.endsWith('[]') && !isArray(item)) item = [item]
          if (isArray(item)) {
            value = map(item, i => normalizeValue(i.value))
          } else {
            value = normalizeValue(item.value)
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
