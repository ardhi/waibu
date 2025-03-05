import escapeChars from './escape-chars.js'

function escape (text) {
  const { forOwn } = this.app.bajo.lib._
  forOwn(escapeChars, (v, k) => {
    text = text.replaceAll(k, v)
  })
  return text
}

export default escape
