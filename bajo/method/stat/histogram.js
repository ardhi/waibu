import prepCrud from '../../../lib/prep-crud.js'

async function histogram ({ coll, req, reply, options = {} }) {
  this.app.bajo.getPlugin('dobo') // ensure dobo is loaded
  const { statHistogram } = this.app.dobo
  const { name, opts } = prepCrud.call(this, { coll, req, options, args: ['coll'] })
  for (const item of ['type', 'group', 'aggregate']) {
    opts[item] = options[item] ?? req.params[item] ?? req.query[item]
  }
  return await statHistogram(name, this.parseFilter(req), opts)
}

export default histogram
