import prepCrud from '../../../lib/prep-crud.js'

async function find ({ coll, req, reply, options = {} }) {
  this.app.bajo.getPlugin('bajoDb') // ensure bajoDb is loaded
  const { recordFind, attachmentFind } = this.app.bajoDb
  const { name, opts } = prepCrud.call(this, { coll, req, options, args: ['coll'] })
  opts.bboxLatField = req.query[this.config.qsKey.bboxLatField]
  opts.bboxLngField = req.query[this.config.qsKey.bboxLngField]
  const filter = this.parseFilter(req)
  const ret = await recordFind(name, filter, opts)
  const { attachment, stats, mimeType } = req.query
  if (attachment) {
    for (const d of ret.data) {
      d._attachment = await attachmentFind(name, d.id, { stats, mimeType })
    }
  }
  return ret
}

export default find
