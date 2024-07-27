async function getUploadedFiles (reqId, fileUrl, returnDir) {
  const { getPluginDataDir, resolvePath } = this.app.bajo
  const { fastGlob } = this.app.bajo.lib
  const dir = `${getPluginDataDir(this.name)}/upload/${reqId}`
  const result = await fastGlob(`${dir}/*`)
  if (!fileUrl) return returnDir ? { dir, files: result } : result
  const files = result.map(f => resolvePath(f, true))
  return returnDir ? { dir, files } : files
}

export default getUploadedFiles
