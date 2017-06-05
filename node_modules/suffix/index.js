'use strict'
const path = require('path')

module.exports = function (filename, suffix) {
  if (typeof filename !== 'string') {
    throw new TypeError('Expected a string as filename')
  }

  const dirname = path.dirname(filename)
  const ext = path.extname(filename)
  const basename = path.basename(filename, ext)

  if (!suffix) {
    return filename
  }

  return path.join(
    dirname,
    basename + suffix + ext
  )
}
