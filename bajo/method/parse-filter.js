function parseFilter (req) {
  const result = {}
  const items = Object.keys(this.config.qsKey)
  for (const item of items) {
    result[item] = req.query[this.config.qsKey[item]]
  }
  return result
}

export default parseFilter
