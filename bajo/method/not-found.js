function notFound (name, options) {
  throw this.error('notFound', { path: name })
}

export default notFound
