const onRoute = {
  level: 5,
  handler: async function (ctx, opts) {
    this.routes.push(opts)
  }
}

export default onRoute
