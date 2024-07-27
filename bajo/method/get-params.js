function getParams (req, ...items) {
  const { map, trim, get } = this.app.bajo.lib._
  let fields
  req.query = req.query ?? {}
  req.params = req.params ?? {}
  if (req.query.fields) fields = map((req.query.fields ?? '').split(','), i => trim(i))
  const params = {
    fields,
    count: get(this, 'config.dbColl.count', false),
    body: req.body
  }
  items.forEach(i => {
    params[i] = req.params[i]
  })
  return params
}

export default getParams
