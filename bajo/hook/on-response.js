const onResponse = {
  level: 5,
  handler: async function onResponse (req, reply) {
    const { get } = this.lib._
    let method = 'info'
    if (reply.statusCode >= 300 && reply.statusCode < 400) method = 'warn'
    else if (reply.statusCode >= 400) method = 'error'
    const ns = get(reply.request, 'routeOptions.config.webApp') ?? this.name
    this.app[ns].log[method]('> %s:%s with a %d-status took %dms', req.method, req.url, reply.statusCode,
      (reply.elapsedTime ?? 0).toFixed(3))
  }
}

export default onResponse
