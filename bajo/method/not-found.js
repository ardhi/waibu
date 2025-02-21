function notFound (name, options) {
  throw this.error('_notFound', { path: name })
}

export default notFound
