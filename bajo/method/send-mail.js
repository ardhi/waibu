import buildLocals from '../../lib/build-locals.js'

async function sendMail (tpl, { to, cc, bcc, from, subject, data = {}, conn, options = {} }) {
  if (!this.app.masohiMail) return
  const { get, isString } = this.app.bajo.lib._
  const { generateId } = this.app.bajo
  const { render } = this.app.bajoTemplate
  if (isString(tpl)) tpl = [tpl]
  const locals = await buildLocals.call(this, { tpl, params: data, opts: options })
  const opts = {
    lang: get(options, 'req.lang'),
    groupId: get(options, 'req.id', generateId())
  }
  const message = await render(tpl[0], locals, opts)
  if (tpl[1]) opts.messageText = await render(tpl[1], locals, opts)
  await this.app.masohi.send({ to, cc, bcc, from, subject, message, conn, options: opts })
}

export default sendMail
