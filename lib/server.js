const path = require('path')
const express = require('express')
const proxyMiddleware = require('http-proxy-middleware')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

module.exports = function (compiler, options) {
  const app = express()

  const devMiddleWare = webpackDevMiddleware(compiler, {
    stats: 'none',
    logLevel: 'error',
    publicPath: compiler.options.output.publicPath
  })

  app.use(devMiddleWare)
  app.use(webpackHotMiddleware(compiler, {
    path: `/__webpack_hmr`,
    log: () => null
  }))

  if (options.setup) {
    options.setup(app)
  }

  const mfs = devMiddleWare.fileSystem
  const file = path.join(compiler.options.output.path, 'index.html')

  // proxy api requests
  if (typeof options.proxy === 'string') {
    app.use(proxyMiddleware('/api', {
      target: options.proxy,
      changeOrigin: true,
      pathRewrite: {
        '^/api': ''
      }
    }))
  } else if (typeof options.proxy === 'object') {
    Object.keys(options.proxy)
          .forEach(context => {
            let proxyOptions = options.proxy[context]
            if (typeof proxyOptions === 'string') {
              proxyOptions = {
                target: proxyOptions,
                changeOrigin: true,
                pathRewrite: {
                  [`^${context}`]: ''
                }
              }
            }
            app.use(proxyMiddleware(context, proxyOptions))
          })
  }

  app.use(require('connect-history-api-fallback')({ index: '/' }))

  app.get('/', (req, res) => {
    devMiddleWare.waitUntilValid(() => {
      const html = mfs.readFileSync(file)
      res.end(html)
    })
  })

  return { app, devMiddleWare }
}
