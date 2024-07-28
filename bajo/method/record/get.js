import prepCrud from '../../../lib/prep-crud.js'

async function get ({ model, req, reply, id, options = {} }) {
  this.app.bajo.getPlugin('dobo') // ensure dobo is loaded
  const { recordGet, attachmentFind } = this.app.dobo
  const { name, recId, opts } = prepCrud.call(this, { model, req, id, options, args: ['model', 'id'] })
  opts.filter = this.parseFilter(req)
  const ret = await recordGet(name, recId, opts)
  const { attachment, stats, mimeType } = req.query
  if (attachment) ret.data._attachment = await attachmentFind(name, id, { stats, mimeType })
  return ret
}

export default get
