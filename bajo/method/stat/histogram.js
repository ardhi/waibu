import prepCrud from '../../../lib/prep-crud.js'

async function histogram ({ model, req, reply, options = {} }) {
  this.app.bajo.getPlugin('dobo') // ensure dobo is loaded
  const { statHistogram } = this.app.dobo
  const { name, opts } = prepCrud.call(this, { model, req, options, args: ['model'] })
  for (const item of ['type', 'group', 'aggregate']) {
    opts[item] = options[item] ?? req.params[item] ?? req.query[item]
  }
  return await statHistogram(name, this.parseFilter(req), opts)
}

export default histogram
