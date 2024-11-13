async function fetch (url, opts = {}, extra = {}) {
  const { getPlugin } = this.app.bajo
  getPlugin('bajoExtra')
  const { fetch } = this.app.bajoExtra
  extra.rawResponse = true

  url = this.routePath(url, { guessHost: true })
  const resp = await fetch(url, opts, extra)
  const result = await resp.json()
  if (!resp.ok) {
    throw this.error(result.message, {
      statusCode: resp.status,
      success: false
    })
  }
  return result
}

export default fetch
