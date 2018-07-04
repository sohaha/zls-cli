/**
 * Created by 影浅-seekwe@gmail.com on 2018-06-27
 */
const fs = require('fs')
const dotenv = require('dotenv')

module.exports = function (options) {
  let env = {}
  const stringifiedEnv = {}
  if (options.env !== false) {
    if (fs.existsSync('.env')) {
      console.log('>  Using .env file')
      env = dotenv.parse(fs.readFileSync('.env', 'utf8'))
    }
    if (typeof options.env === 'object') {
      env = Object.assign(env, options.env)
    }
  }
  for (const key in env) {
    if (env.hasOwnProperty(key)) {
      stringifiedEnv[key] = JSON.stringify(env[key])
      if (key !== 'NODE_ENV') {
        process.env[key] = env[key]
      }
    }
  }
  return { env, stringifiedEnv }
}
