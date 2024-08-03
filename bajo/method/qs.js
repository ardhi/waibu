import queryString from 'query-string'

function parse (item) {
  return queryString.parse(item, {
    parseBooleans: true,
    parseNumbers: true
  })
}

const qs = {
  parse,
  parseUrl: queryString.parseUrl,
  stringify: queryString.stringify,
  stringifyUrl: queryString.stringifyUrl
}

export default qs
