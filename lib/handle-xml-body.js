// based on: https://github.com/NaturalIntelligence/fastify-xml-body-parser/blob/master/index.js

async function xmlBodyParser (ctx, opts = {}) {
  if (!this.app.bajoExtra) {
    this.log.warn('Can\'t parse XML body unless package \'%s\' is loaded first', 'bajo-extra')
    return
  }
  const { importPkg } = this.app.bajo
  const fxp = await importPkg('bajoExtra:fast-xml-parser')

  function contentParser (req, payload, done) {
    const xmlParser = new fxp.XMLParser(opts)
    const parsingOpts = opts
    let body = ''
    payload.on('error', errorListener)
    payload.on('data', dataListener)
    payload.on('end', endListener)

    function errorListener (err) {
      done(err)
    }
    function endListener () {
      if (parsingOpts.validate) {
        const result = fxp.XMLValidator.validate(body, parsingOpts)
        if (result.err) {
          const invalidFormat = new Error('Invalid Format: ' + result.err.msg)
          invalidFormat.statusCode = 400
          payload.removeListener('error', errorListener)
          payload.removeListener('data', dataListener)
          payload.removeListener('end', endListener)
          done(invalidFormat)
        } else {
          handleParseXml(body)
        }
      } else {
        handleParseXml(body)
      }
    }
    function dataListener (data) {
      body = body + data
    }
    function handleParseXml (body) {
      try {
        done(null, xmlParser.parse(body))
      } catch (err) {
        done(err)
      }
    }
  }

  ctx.addContentTypeParser(opts.contentTypes, contentParser)
}

export default xmlBodyParser
