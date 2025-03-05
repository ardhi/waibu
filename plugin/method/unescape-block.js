function unescapeBlock (content, start, end, startReplacer, endReplacer) {
  const { extractText } = this.app.bajo
  const { result } = extractText(content, start, end)
  if (result.length === 0) return content
  const unescaped = this.unescape(result)
  const token = `${start}${result}${end}`
  const replacer = `${startReplacer}${unescaped}${endReplacer}`
  const block = content.replaceAll(token, replacer)
  return unescapeBlock.call(this, block, start, end, startReplacer, endReplacer)
}

export default unescapeBlock
