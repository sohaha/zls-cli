/**
 * Created by 影浅-Seekwe on 2017-02-27 00:52:21
 */
const files = require.context('.', false, /\.js$/)
const modules = {}

files.keys()
  .forEach((key) => {
    if (key === './index.js') return
    modules[key.replace(/(\.\/|\.js)/g, '')] = files(key).default
  })

export default modules