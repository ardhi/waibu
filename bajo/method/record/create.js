import prepCrud from '../../../lib/prep-crud.js'

async function create ({ model, req, reply, body, options = {} }) {
  this.app.bajo.getPlugin('dobo') // ensure dobo is loaded
  const { recordCreate, attachmentFind } = this.app.dobo
  const { name, input, opts } = prepCrud.call(this, { model, req, body, options, args: ['model'] })
  const ret = await recordCreate(name, input, opts)
  const { attachment, stats, mimeType } = req.query
  if (attachment) ret.data._attachment = await attachmentFind(name, ret.data.id, { stats, mimeType })
  return ret
}

export default create
