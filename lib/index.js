/**
 * Created by 影浅-seekwe@gmail.com on 2018-06-27
 */
const fs = require('fs')
const path = require('path')
const sep = path.sep
const chalk = require('chalk')
const webpack = require('webpack')  // https://webpack.js.org
const HtmlPlugin = require('html-webpack-plugin')
const PostCompilePlugin = require('post-compile-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const isYarn = require('installed-by-yarn-globally')
const webpackMerge = require('webpack-merge')
// const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')
// const InterpolateHtmlPlugin = require('./html/interpolate-html')
const InterpolateCdnPlugin = require('./html/interpolate-cdn')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin
const {
  cwd,
  ownDir,
  fsExistsSync,
  getPublicPath,
  getFilenames
} = require('./utils')
const run = require('./run')
const loaders = require('./loaders')
const loadConfig = require('./load-config')
const AppError = require('./app-error')
const defaultOptions = require('./default-options')
const appEnv = require('./env')

module.exports = function (cliOptions = {}) {
  // eslint-disable-line complexity
  console.log('> Starting...')
  let state = {
    openBrowser: false
  }
  let defaultOpt = defaultOptions()

  let userConfig = loadConfig(cliOptions, defaultOpt)

  let options = Object.assign(defaultOpt, userConfig, cliOptions)

  let { env, stringifiedEnv } = appEnv(options)

  env.NODE_ENV = options.dev ? 'development' : 'production'
  if (options.dev) {
    options['entryDefault'] = defaultOpt['entryDefault']
  }

  options['hmrEntry'] = typeof options['hmrEntry'] === 'object' && options['hmrEntry'].length > 0 ? options['hmrEntry'] : [options['entryDefault']]

  let distHtml = options.dev ?
    '' :
    options.distHtml ? cwd(options.distHtml) + '/' : ''

  let postcssOptions = options.postcss

  let defaultPostcssPlugins = [
    require('autoprefixer')(
      Object.assign({
          browsers: ['ie > 9', 'Android >= 4.0', 'iOS >= 8', '> 1%']
        },
        options.autoprefixer
      )
    )
  ]

  if (options.px2rem) {
    let defaultPx2remOptions = {
      baseDpr: 1,
      remUnit: options.px2rem === 'number' ? options.px2rem : 100,
      keep1px: true
    }
    let px2remOptions =
      options.px2rem === true ?
        defaultPx2remOptions :
        Object.assign(defaultPx2remOptions, options.px2rem)

    defaultPostcssPlugins.push(require('zls-px2rem-loader')(px2remOptions))
  }

  postcssOptions.plugins = [].concat(postcssOptions.plugins || [], defaultPostcssPlugins)

  //
  // if (!Object.prototype.hasOwnProperty.call(options, 'postcss')) {
  //   postcssOptions = defaultPostcssPlugins
  // } else if (options.autoprefixer !== false) {
  //   if (Array.isArray(postcssOptions)) {
  //     postcssOptions = defaultPostcssPlugins.concat(postcssOptions)
  //   } else if (typeof postcssOptions === 'object') {
  //     postcssOptions.plugins = postcssOptions.plugins || []
  //     postcssOptions.plugins = defaultPostcssPlugins.concat(
  //       postcssOptions.plugins
  //     )
  //   }
  // }

  if (options.entry === 'index.js' && !fs.existsSync(options.entry)) {
    throw new AppError(
      `Entry file ${chalk.yellow(
        options.entry
      )} does not exist, did you forget to create one?`
    )
  }

  if (options.dev) {
    options = Object.assign({
        vendor: true,
        host: 'localhost',
        port: 3780,
        hot: true,
        hmrEntry: options.hmrEntry,
        sourceMap: 'eval-source-map'//'inline-source-map'
      },
      options
    )
    options.minimizeCss = false
    options.minimizeJS = false
  } else {
    options = Object.assign({
        vendor: true,
        minimize: true,
        sourceMap: 'source-map',
        extract: true
      },
      options
    )
    options.minimizeCss = typeof options.minimizeCss !== 'undefined' ? options.minimizeCss : options.minimize
    options.minimizeJS = typeof options.minimizeJS !== 'undefined' ? options.minimizeJS : options.minimize
  }

  options.alias = Object.assign({
      '@': cwd(options.rootDirectory),
      '~': cwd(options.rootDirectory)
    },
    options.alias
  )

  const filename = getFilenames(options)
  const cssOptions = {
    extract: !options.dev && !!options.extract,
    sourceMap: Boolean(options.sourceMap),
    cssModules: options.cssModules,
    minimize: !options.dev && !!options.minimizeCss,
    alias: (e => {
      let alias = {}
      for (let k in e) {
        if (e.hasOwnProperty(k)) {
          let key = k.indexOf('./') === 0 ? k : './' + k
          alias[key] = e[k]
        }
      }
      return alias
    })(options.alias)
  }

  let publicPath = getPublicPath(options.cdnPath, options.dev, '/')

  let publicImagePath = options.cdnImagePath ?
    getPublicPath(options.cdnImagePath, options.dev) :
    publicPath

  let cssLoader = loaders.styleLoaders(cssOptions, postcssOptions)

  let webpackConfig = {
    optimization: {
      runtimeChunk: { name: 'manifest' },
      splitChunks: {
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all'
          },
          'async-vendors': {
            test: /[\\/]node_modules[\\/]/,
            minChunks: 2,
            chunks: 'async',
            name: 'async-vendors'
          },
          commons: {
            name: 'commons',
            chunks: 'initial',
            minChunks: Infinity
          },
          manifest: {
            name: 'manifest',
            minChunks: Infinity
          }
        }
      }
    },
    mode: env.NODE_ENV,
    devServer: {
      hot: true,
      quiet: true
    },
    entry: {
      [options['entryDefault']]: []
    },
    externals: options.externals,
    devtool: options.sourceMap,
    output: {
      path: cwd(options.dist),
      publicPath: publicPath,
      filename: filename.js,
      chunkFilename: filename.chunk
    },
    performance: {
      hints: false
    },
    resolve: {
      extensions: ['.js', '.json', '.vue', '.css', '.jsx'],
      modules: [cwd(), cwd('node_modules'), ownDir('node_modules')],
      alias: Object.assign({
          vue$: options.templateCompiler ?
            'vue/dist/vue.esm.js' : 'vue/dist/vue.runtime.esm.js'
        },
        options.alias
      )
    },
    resolveLoader: {
      modules: [cwd('node_modules'), ownDir('node_modules')]
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            // hotReload: false // 关闭热重载
          }
        },
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: options.babel
          },
          include(filepath) {
            // return filepath
            if (filepath.split(/[/\\]/)
                        .indexOf('node_modules') === -1) {
              return true
            }
            if (options.transpileModules) {
              for (const name of options.transpileModules) {
                if (
                  filepath.indexOf(`${sep}node_modules${sep}${name}${sep}`) !==
                  -1
                ) {
                  return true
                }
              }
            } else {
              return /\.vue\.js/.test(filepath)
            }
          }

        },
        {
          test: /\.jsx$/,
          use: 'babel-loader'
        },
        {
          test: /\.es6$/,
          use: 'babel-loader'
        },
        {
          test: /\.(svg)(\?.*)?$/,
          use: [{
            loader: 'file-loader',
            query: {
              name: filename.static
            }
          }]
        }
      ].concat(cssLoader)
    },
    plugins: [
      new VueLoaderPlugin(),
      new webpack.ProvidePlugin({
        Promise: 'Promise'
      }),
      // new FriendlyErrorsPlugin(),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new PostCompilePlugin(stats => {
        process.stdout.write('\x1Bc')
        if (options.dev && !options.watch) {
          if (stats.hasErrors() || stats.hasWarnings()) {
            console.log(stats.toString('errors-only'))
            console.log()
            console.log(chalk.bgRed.black(' ERROR '), 'Compiling failed!')
          } else {
            console.log(stats.toString(options.stats))
            if (webpackConfig.target === 'electron-renderer') {
              console.log(chalk.bold(`\n> Open Electron in another tab\n`))
            } else {
              console.log(
                chalk.bold(`\n> Open http://localhost:${options.port}\n`)
              )
              if (!state.openBrowser && options.openBrowser) {
                state.openBrowser = true
                require('auto-open-browser')(`http://localhost:${options.port}`)
              }
            }
            // console.log(chalk.bgGreen.black(' DONE '), 'Compiled successfully!')
          }
          console.log()
        }
      }),
      new webpack.DefinePlugin(
        Object.assign({
            process: {
              env: stringifiedEnv
            }
          },
          options.define, {
            __STATIC__: JSON.stringify(publicPath)
          }
        )
      )
      // new webpack.LoaderOptionsPlugin({
      //   minimize: false,
      //   options: {
      //     context: cwd(),
      //     babel: options.babel
      //     // postcss: postcssOptions,
      //     // vue: {
      //     //   postcss: postcssOptions,
      //     //   loaders: loaders.cssLoaders(cssOptions),
      //     //   cssModules: {
      //     //     localIndentName: '[name]__[local]___[hash:base64:5]'
      //     //   }
      //     // }
      //   }
      // })
    ]
  }
  if (typeof options.entry === 'string') {
    webpackConfig.entry[defaultOpt['entryDefault']].push(options.entry)
  } else if (Array.isArray(options.entry)) {
    webpackConfig.entry[defaultOpt['entryDefault']] = options.entry
  } else if (typeof options.entry === 'object') {
    webpackConfig.entry = options.entry
  }

  if (options.format === 'cjs') {
    webpackConfig.output.libraryTarget = 'commonjs2'
    Object.assign(webpackConfig.externals, {
      'webpack-node-externals': require('webpack-node-externals')(),
      vue: 'vue',
      'babel-runtime': 'babel-runtime'
    })
  } else if (options.format === 'umd') {
    webpackConfig.output.libraryTarget = 'umd'
    webpackConfig.output.library = options.moduleName || ''
  } else if (options.format) {
    webpackConfig.output.libraryTarget = options.format
  }

  // webpackConfig.plugins.push(
  //   new webpack.ProvidePlugin({
  //     'Promise': 'es6-promise',
  //   }))

  // webpackConfig.module = Object.assign({
  //     noParse: /es6-promise\/dist\/es6-promise\.auto\.min\.js$/
  //     // parser: { amd: true }
  //   },
  //   webpackConfig.module
  // )

  let defaultHtmlConfig = Object.assign({}, env, {
    title: 'Zls',
    description: 'Zls.init',
    filename: distHtml + 'index.html',
    template: ownDir('lib/template.html'),
    promise: !!options.promise,
    // excludeChunks: ['promise'],
    minify: {
      removeAttributeQuotes: true,
      removeComments: true,
      collapseWhitespace: true
    }
  })

  let moduleImage = [{
    loader: 'url-loader',
    query: {
      limit: options.urlLimit,
      name: filename.static,
      publicPath: publicImagePath
    }
  }]

  let htmlConfig = {}

  if (options.html) {
    if (Array.isArray(options.html)) {
      htmlConfig = options.html.map(html => {
        if (!!html['filename']) html['filename'] = distHtml + html['filename']
        return new HtmlPlugin(Object.assign(defaultHtmlConfig, html))
      })
    } else {
      if (!!options.html['filename'])
        options.html['filename'] = distHtml + options.html['filename']
      htmlConfig = [
        new HtmlPlugin(Object.assign(defaultHtmlConfig, options.html))
      ]
    }
    webpackConfig.plugins = webpackConfig.plugins.concat(htmlConfig)

  } else if (options.html !== false) {
    webpackConfig.plugins = webpackConfig.plugins.concat([
      new HtmlPlugin(defaultHtmlConfig)
    ])
  }

  // webpackConfig.plugins.push(new htmlPluginEvents())

  if (options.eslint) {
    webpackConfig.module.rules.push({
      test: /\.(vue|js|jsx)$/,
      loader: 'eslint-loader',
      enforce: 'pre',
      exclude: [/node_modules/],
      options: Object.assign({
          env: {
            browser: true
          },
          // extends: 'eslint-config-standard',
          plugins: ['html'],
          rules: {
            // allow paren-less arrow functions
            'arrow-parens': 0,
            // allow async-await
            'generator-star-spacing': 0,
            // allow debugger during development
            'no-debugger': options.env ? 0 : 2
          },
          configFile: fsExistsSync(cwd('.eslintrc.js')) ?
            cwd('.eslintrc.js') : require.resolve('./eslint-config.js'),
          useEslintrc: false
        },
        options.eslintConfig
      )
    })
  }

  if (options.extract) {
    webpackConfig.plugins.push(
      new MiniCssExtractPlugin({
        filename: filename.css,
        allChunks: true
      }),
      new OptimizeCSSPlugin({
        cssProcessorOptions: {
          safe: true
        }
      })
    )
  }

  if (isYarn(__dirname)) {
    webpackConfig.resolve.modules.push(ownDir('..'))
    webpackConfig.resolveLoader.modules.push(ownDir('..'))
  }

  if (cliOptions.dev) {

    if (options.hot && !options.watch) {
      const hmrEntry = options.hmrEntry
      for (const entry of hmrEntry) {
        webpackConfig.entry[entry] = Array.isArray(webpackConfig.entry[entry]) ?
          webpackConfig.entry[entry] : [webpackConfig.entry[entry]]
        webpackConfig.entry[entry].unshift(ownDir('lib/client.js'))
      }

      webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin())
      webpackConfig.plugins.push(new webpack.NamedModulesPlugin())
    }

  } else {

    if (options.preload) {
      const PreloadWebpackPlugin = require('preload-webpack-plugin')
      let preload = typeof options.preload === 'object' ? options.preload : {
        rel: 'preload',
        as(entry) {
          if (/\.css(\?|$)/.test(entry)) return 'style'
          if (/\.(woff|ttf|woff2)(\?|$)/.test(entry)) return 'font'
          if (/\.(png|jpg|gif)(\?|$)/.test(entry)) return 'image'
          return 'script'
        },
        include: 'initial',
        fileBlacklist: [/\.(map)(\?|$)/, /base?.+/]
      }
      webpackConfig.plugins.push(new PreloadWebpackPlugin(preload))
    }

    /*    if (options.minimizeImage === true) {
     moduleImage.push({
     loader: "image-webpack-loader"
     })
     } else if (typeof options.minimizeImage === "object") {
     moduleImage.push(options.minimizeImage)
     }*/

    if (options.analyzer) {
      if (typeof options.analyzer === 'boolean') {
        webpackConfig.plugins.push(new BundleAnalyzerPlugin())
      } else {
        webpackConfig.plugins.push(new BundleAnalyzerPlugin(options.analyzer))
      }
    }
    // 进度
    // const ProgressPlugin = require('webpack/lib/ProgressPlugin')
    // const NoEmitOnErrorsPlugin = require("webpack/lib/NoEmitOnErrorsPlugin")

    // webpackConfig.plugins.push(new ProgressPlugin())
    // webpackConfig.plugins.push(new ProgressPlugin(), new NoEmitOnErrorsPlugin())

  }

  if (options.minimizeJS) {
    let compressor =
      options.minimizeJS !== true ?
        options.minimizeJS : {
          warnings: false,
          conditionals: true,
          unused: true,
          comparisons: true,
          sequences: true,
          dead_code: true,
          evaluate: true,
          if_return: true,
          join_vars: true,
          negate_iife: false
        }
    const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
    webpackConfig.optimization.minimizer = [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: Boolean(options.sourceMap),
        uglifyOptions: {
          compress: compressor
        }
      })
    ]
  } else {
    webpackConfig.optimization.minimize = false
  }

  // copy ./static/** to dist folder
  let copyConfig
  if (typeof options.copy === 'object') {
    copyConfig = options.copy
  } else if (!options.copy) {
    if (fs.existsSync('static')) {
      copyConfig = [{
        from: 'static',
        to: 'static'//cwd(options.dist)
      }]
    }
  }

  if (copyConfig) webpackConfig.plugins.push(new CopyPlugin(copyConfig))
  if (options.vendor && !options.format) {
    // Do not split vendor in `cjs` and `umd` format
    // webpackConfig.plugins.push(new webpack.optimize.CommonsChunkPlugin({
    //   name: 'vendor',
    //   minChunks: module => {
    //     return module.resource && /\.(js|css|es6)$/.test(module.resource) && module.resource.indexOf('node_modules') !== -1
    //   }
    // }))
    /*         webpackConfig.plugins.push(
     new webpack.optimize.CommonsChunkPlugin({
     name: "manifest"
     })
     ) */
    // if (typeof webpackConfig.entry === 'object')
    // for (let k in webpackConfig.entry) {
    // }
    /*         if (options.promise === true) {
     webpackConfig.entry["promise"] = require.resolve(
     "es6-promise/dist/es6-promise.auto.min.js"
     )
     } else if (!!options.promise) {
     webpackConfig.entry["promise"] = options.promise
     } */
  }

  webpackConfig.module.rules.push({
    test: /\.(ico|jpg|png|gif|eot|otf|webp|ttf|woff|woff2)(\?.*)?$/,
    loaders: moduleImage
  })

  options.lib = !!options.format

  // 注入环境变量
  // webpackConfig.plugins.push(new InterpolateHtmlPlugin(env))

  if (!options.dev && !!options.externalsCdn && options.externalsCdn.length > 0) {
    webpackConfig.plugins.push(new InterpolateCdnPlugin({
        modules: options.externalsCdn
        // prod: !options.dev
      }
    ))
  }

  // plugins: [new BundleAnalyzerPlugin()]
  // merge webpack config
  if (typeof options.webpack === 'function') {
    webpackConfig = options.webpack(webpackConfig, webpack, webpackMerge.smart)
  } else if (typeof options.webpack === 'object') {
    webpackConfig = webpackMerge.smart(webpackConfig, options.webpack)
  }
  // console.log(JSON.stringify(options.babel.plugins))
  // console.log(JSON.stringify(webpackConfig))
  return run(webpackConfig, options)
}

