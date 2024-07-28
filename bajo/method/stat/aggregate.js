import prepCrud from '../../../lib/prep-crud.js'

async function aggregate ({ model, req, reply, options = {} }) {
  this.app.bajo.getPlugin('dobo') // ensure dobo is loaded
  const { statAggregate } = this.app.dobo
  const { name, opts } = prepCrud.call(this, { model, req, options, args: ['model'] })
  for (const item of ['group', 'aggregate']) {
    opts[item] = options[item] ?? req.params[item] ?? req.query[item]
  }
  return await statAggregate(name, this.parseFilter(req), opts)
}

export default aggregate
