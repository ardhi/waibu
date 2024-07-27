import prepCrud from '../../../lib/prep-crud.js'

async function aggregate ({ coll, req, reply, options = {} }) {
  this.app.bajo.getPlugin('bajoDb') // ensure bajoDb is loaded
  const { statAggregate } = this.app.bajoDb
  const { name, opts } = prepCrud.call(this, { coll, req, options, args: ['coll'] })
  for (const item of ['group', 'aggregate']) {
    opts[item] = options[item] ?? req.params[item] ?? req.query[item]
  }
  return await statAggregate(name, this.parseFilter(req), opts)
}

export default aggregate
