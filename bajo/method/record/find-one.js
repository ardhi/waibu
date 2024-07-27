import prepCrud from '../../../lib/prep-crud.js'

async function find ({ coll, req, reply, options = {} }) {
  this.app.bajo.getPlugin('bajoDb') // ensure bajoDb is loaded
  const { recordFindOne, attachmentFind } = this.app.bajoDb
  const { name, opts } = prepCrud.call(this, { coll, req, options, args: ['coll'] })
  opts.bboxLatField = req.query[this.config.qsKey.bboxLatField]
  opts.bboxLngField = req.query[this.config.qsKey.bboxLngField]
  const filter = this.parseFilter(req)
  const ret = await recordFindOne(name, filter, opts)
  ret.filter = filter
  const { attachment, stats, mimeType } = req.query
  if (attachment) {
    ret.data._attachment = await attachmentFind(name, ret.data.id, { stats, mimeType })
  }
  return ret
}

export default find
