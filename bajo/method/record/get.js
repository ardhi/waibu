import prepCrud from '../../../lib/prep-crud.js'

async function get ({ coll, req, reply, id, options = {} }) {
  this.app.bajo.getPlugin('bajoDb') // ensure bajoDb is loaded
  const { recordGet, attachmentFind } = this.app.bajoDb
  const { name, recId, opts } = prepCrud.call(this, { coll, req, id, options, args: ['coll', 'id'] })
  opts.filter = this.parseFilter(req)
  const ret = await recordGet(name, recId, opts)
  const { attachment, stats, mimeType } = req.query
  if (attachment) ret.data._attachment = await attachmentFind(name, id, { stats, mimeType })
  return ret
}

export default get
