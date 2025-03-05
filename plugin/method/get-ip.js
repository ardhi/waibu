function getIp (req) {
  let fwd = req.headers['x-forwarded-for'] ?? ''
  if (!Array.isArray(fwd)) fwd = fwd.split(',').map(ip => ip.trim())
  return fwd[0] ?? req.ip
}

export default getIp
