const onRoute = {
  level: 5,
  handler: async function (opts) {
    this.routes.push(opts)
  }
}

export default onRoute
