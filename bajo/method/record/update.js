import prepCrud from '../../../lib/prep-crud.js'

async function update ({ coll, req, reply, id, body, options = {} }) {
  this.app.bajo.getPlugin('bajoDb') // ensure bajoDb is loaded
  const { recordUpdate, attachmentFind } = this.app.bajoDb
  const { name, input, opts, recId } = prepCrud.call(this, { coll, req, body, id, options, args: ['coll', 'id'] })
  const ret = await recordUpdate(name, recId, input, opts)
  const { attachment, stats, mimeType } = req.query
  if (attachment) ret.data._attachment = await attachmentFind(name, id, { stats, mimeType })
  return ret
}

export default update
