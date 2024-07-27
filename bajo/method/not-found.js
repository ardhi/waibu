function notFound (name, options) {
  throw this.error('notfound', { path: name })
}

export default notFound
