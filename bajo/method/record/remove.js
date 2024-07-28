import prepCrud from '../../../lib/prep-crud.js'

async function remove ({ model, req, reply, id, options = {} }) {
  this.app.bajo.getPlugin('dobo') // ensure dobo is loaded
  const { recordRemove } = this.app.dobo
  const { name, recId, opts } = prepCrud.call(this, { model, req, id, options, args: ['model', 'id'] })
  return await recordRemove(name, recId, opts)
}

export default remove
