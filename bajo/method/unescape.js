import escapeChars from './escape-chars.js'

function unescape (text) {
  const { forOwn, invert } = this.app.bajo.lib._
  const mapping = invert(escapeChars)
  forOwn(mapping, (v, k) => {
    text = text.replaceAll(k, v)
  })
  return text
}

export default unescape
