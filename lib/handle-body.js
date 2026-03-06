export function normalizeValue (value) {
  const { isSet } = this.app.lib.aneka
  const { isArray, trim, isPlainObject } = this.app.lib._
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
    } else value = val
  }
  return value
}

async function handleBody (options = {}) {
  const me = this
  this.instance.addHook('preValidation', async function (req, reply) {
    if (req.body) {
      for (const key in req.body) {
        req.body[key] = normalizeValue.call(me, req.body[key])
      }
    }
  })
}

export default handleBody
