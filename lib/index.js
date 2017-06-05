const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const webpack = require('webpack')
const HtmlPlugin = require('html-webpack-plugin')
const PostCompilePlugin = require('post-compile-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const isYarn = require('installed-by-yarn-globally')
const webpackMerge = require('webpack-merge')
const dotenv = require('dotenv')
const InterpolateHtmlPlugin = require('interpolate-html-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const {
  cwd,
  ownDir,
  getPublicPath
} = require('./utils')
const run = require('./run')
const loaders = require('./loaders')
const loadConfig = require('./load-config')
const AppError = require('./app-error')
const htmlPluginEvents = require('./html-plugin-events')

module.exports = function (cliOptions = {}) { // eslint-disable-line complexity
  console.log('> Starting...')
  let defaultOpt = {
    entry: 'index.js',
    dist: 'dist',
    entryDefault: 'client',
    distHtml: '',
    rootDirectory: 'src',
    cdnPath: '',
    analyzer: false,
    html: {},
    babel: {
      "plugins": [
        [
          require.resolve('babel-plugin-transform-runtime'), {
            helpers: true,
            polyfill: true,
            regenerator: true,
            // Resolve the Babel runtime relative to the config.
            moduleName: path.dirname(require.resolve('babel-runtime/package'))
          },
          require.resolve('babel-plugin-transform-vue-jsx')
        ]
      ],
      cacheDirectory: true,
      presets: [
        [
          require.resolve('babel-preset-env'), {
            modules: false,
            targets: {
              ie: 9,
              uglify: true
            },
            useBuiltIns: true
          }
        ],
        require.resolve('babel-preset-stage-2')
      ]
    },
    stats: {
      chunks: false,
      children: false,
      modules: false,
      colors: true
    }
  }

  const userConfig = loadConfig(cliOptions, defaultOpt)
  let options = Object.assign(defaultOpt, userConfig, cliOptions)

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

  env.NODE_ENV = options.dev ? 'development' : 'production'
  for (const key in env) {
    stringifiedEnv[key] = JSON.stringify(env[key])
    if (key !== 'NODE_ENV') {
      process.env[key] = env[key]
    }
  }
  if (options.dev) {
    options['entryDefault'] = defaultOpt['entryDefault']
  }
  options['hmrEntry'] = [options['entryDefault']]

  let distHtml = options.dev ? '' : options.distHtml ? cwd(options.distHtml) + '/' : ''

  let postcssOptions = options.postcss
  const defaultPostcssPlugins = [
    require('autoprefixer')(Object.assign({
      browsers: ['ie > 8', 'last 8 versions']
    }, options.autoprefixer))
  ]
  if (!Object.prototype.hasOwnProperty.call(options, 'postcss')) {
    postcssOptions = defaultPostcssPlugins
  } else if (options.autoprefixer !== false) {
    if (Array.isArray(postcssOptions)) {
      postcssOptions = defaultPostcssPlugins.concat(postcssOptions)
    } else if (typeof postcssOptions === 'object') {
      postcssOptions.plugins = postcssOptions.plugins || []
      postcssOptions.plugins = defaultPostcssPlugins.concat(postcssOptions.plugins)
    }
  }

  if (options.entry === 'index.js' && !fs.existsSync(options.entry)) {
    throw new AppError(`Entry file ${chalk.yellow(options.entry)} does not exist, did you forget to create one?`)
  }

  if (options.dev) {
    options = Object.assign({
      host: 'localhost',
      port: 3780,
      hot: true,
      hmrEntry: options.hmrEntry,
      sourceMap: 'eval-source-map'
    }, options)
  } else {
    options = Object.assign({
      vendor: true,
      minimize: true,
      sourceMap: 'source-map',
      extract: true
    }, options)
  }
  const filename = getFilenames(options)

  const cssOptions = {
    extract: options.extract,
    sourceMap: Boolean(options.sourceMap),
    cssModules: options.cssModules
  }
  let publicPath = getPublicPath(options.cdnPath, options.dev)
  let publicImagePath = options.cdnImagePath ? getPublicPath(options.cdnImagePath, options.dev) : publicPath
  let webpackConfig = {
    entry: {
      [options['entryDefault']]: []
    },
    devtool: options.sourceMap,
    output: {
      path: cwd(options.dist),
      publicPath: publicPath,
      filename: filename.js,
      chunkFilename: filename.chunk,
    },
    performance: {
      hints: false
    },
    resolve: {
      extensions: ['.js', '.json', '.vue', '.css'],
      modules: [
        cwd(),
        cwd('node_modules'),
        ownDir('node_modules')
      ],
      alias: {
        '@': cwd(options.rootDirectory),
        vue$: options.templateCompiler ? 'vue/dist/vue.esm.js' : 'vue/dist/vue.runtime.esm.js',
      }
    },
    resolveLoader: {
      modules: [
        cwd('node_modules'),
        ownDir('node_modules')
      ]
    },
    module: {
      rules: [{
        test: /\.js$/,
        loader: 'babel-loader',
        include(filepath) {
          // for anything outside node_modules
          if (filepath.split(/[/\\]/)
            .indexOf('node_modules') === -1) {
            return true
          }
          // specific modules that need to be transpiled by babel
          if (options.transpileModules) {
            for (const name of options.transpileModules) {
              if (filepath.indexOf(`/node_modules/${name}/`) !== -1) {
                return true
              }
            }
          }
        }
      }, {
        test: /\.es6$/,
        loader: 'babel-loader'
      }, {
        test: /\.vue$/,
        loader: 'vue-loader'
      }, {
        test: /\.(svg)(\?.*)?$/,
        loader: 'file-loader',
        query: {
          name: filename.static
        }
      }].concat(loaders.styleLoaders(cssOptions))
    },
    plugins: [
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
              console.log(chalk.bold(`\n> Open http://localhost:${options.port}\n`))
            }
            console.log(chalk.bgGreen.black(' DONE '), 'Compiled successfully!')
          }
          console.log()
        }
      }),
      new webpack.DefinePlugin(Object.assign({
        process: {
          env: stringifiedEnv
        }
      }, options.define)),
      new webpack.LoaderOptionsPlugin({
        minimize: !options.dev && options.minimize,
        options: {
          context: cwd(),
          babel: options.babel,
          postcss: postcssOptions,
          vue: {
            postcss: postcssOptions,
            loaders: loaders.cssLoaders(cssOptions),
            cssModules: {
              localIndentName: '[name]__[local]___[hash:base64:5]'
            }
          }
        }
      })
    ]
  }

  if (typeof options.entry === 'string') {
    webpackConfig.entry[defaultOpt['entryDefault']].push(options.entry)
  } else if (Array.isArray(options.entry)) {
    webpackConfig.entry[defaultOpt['entryDefault']] = options.entry
  } else if (typeof options.entry === 'object') {
    webpackConfig.entry = options.entry
  }

  if (options.promise === true) {
    webpackConfig.entry['promise'] = require.resolve('es6-promise/auto')
  } else if (!!options.promise) {
    webpackConfig.entry['promise'] = options.promise
  }


  if (options.format === 'cjs') {
    webpackConfig.output.libraryTarget = 'commonjs2'
    webpackConfig.externals = [
      // the modules in $cwd/node_modules
      require('webpack-node-externals')(),
      // modules that might be loaded from zls/node_modules
      'vue',
      'babel-runtime'
    ]
  } else if (options.format === 'umd') {
    webpackConfig.output.libraryTarget = 'umd'

    if (options.moduleName) {
      webpackConfig.output.library = options.moduleName
    } else {
      throw new AppError('> `moduleName` is required when bundling in `umd` format')
    }
  }

  // webpackConfig.plugins.push(
  //   new webpack.ProvidePlugin({
  //     'Promise': 'es6-promise',
  //   }))

  // webpackConfig.module = Object.assign({
  //   noParse: /es6-promise\.js$/
  // },webpackConfig.module)

  let defaultHtmlConfig = {
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
  }

  let moduleImage = [{
    loader: 'url-loader',
    query: {
      limit: 3072,
      name: filename.static,
      publicPath: publicImagePath
    }
  }]

  let htmlConfig = {}
  webpackConfig.plugins.push(new InterpolateHtmlPlugin(env))

  if (options.html) {
    if (Array.isArray(options.html)) {
      htmlConfig = options.html.map((html) => {
        if (!!html['filename']) html['filename'] = distHtml + html['filename']
        return new HtmlPlugin(Object.assign(defaultHtmlConfig, html))
      })
    } else {
      if (!!options.html['filename']) options.html['filename'] = distHtml + options.html['filename']
      htmlConfig = [new HtmlPlugin(Object.assign(defaultHtmlConfig, options.html))]
    }
    webpackConfig.plugins = webpackConfig.plugins.concat(htmlConfig)
  } else if (options.html !== false) {
    webpackConfig.plugins = webpackConfig.plugins.concat([new HtmlPlugin(defaultHtmlConfig)])
  }

  webpackConfig.plugins.push(new htmlPluginEvents())


  if (options.eslint) {
    webpackConfig.module.rules.push({
      test: /\.(vue|js)$/,
      loader: 'eslint-loader',
      enforce: 'pre',
      exclude: [/node_modules/],
      options: Object.assign({
        configFile: require.resolve('eslint-config-vue-app'),
        useEslintrc: false,
        fix: options.eslintFix || true
      }, options.eslintConfig)
    })
  }


  if (options.extract) {
    webpackConfig.plugins.push(
      new ExtractTextPlugin({
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

  // copy ./static/** to dist folder
  if (typeof (options.copy) === 'object') {
    webpackConfig.plugins.push(new CopyPlugin(options.copy))
  } else if (typeof (options.copy) === 'undefined') {
    if (fs.existsSync('static')) {
      webpackConfig.plugins.push(new CopyPlugin([{
        from: 'static',
        to: './'
      }]))
    }
  }

  // installed by `yarn global add`
  if (isYarn(__dirname)) {
    // modules in yarn global node_modules
    // because of yarn's flat node_modules structure
    webpackConfig.resolve.modules.push(ownDir('..'))
    // loaders in yarn global node_modules
    webpackConfig.resolveLoader.modules.push(ownDir('..'))
  }

  if (cliOptions.dev) {
    if (options.hot && !options.watch) {
      const hmrEntry = options.hmrEntry
      for (const entry of hmrEntry) {
        webpackConfig.entry[entry] = Array.isArray(webpackConfig.entry[entry]) ?
          webpackConfig.entry[entry] : [webpackConfig.entry[entry]]
        webpackConfig.entry[entry].unshift(ownDir('lib/dev-client.es6'))
      }

      webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin())
    }
  } else {
    if (options.minimizeImage === true) {
      moduleImage.push({
        loader: 'image-webpack-loader'
      })
    } else if (typeof options.minimizeImage === "object") {
      moduleImage.push(options.minimizeImage)
    }

    if (options.analyzer) {
      if (typeof options.analyzer === "boolean") {
        webpackConfig.plugins.push(new BundleAnalyzerPlugin())
      } else {
        webpackConfig.plugins.push(new BundleAnalyzerPlugin(options.analyzer))
      }
    }
    const ProgressPlugin = require('webpack/lib/ProgressPlugin')
    const NoEmitOnErrorsPlugin = require('webpack/lib/NoEmitOnErrorsPlugin')

    webpackConfig.plugins.push(
      new ProgressPlugin(),
      new NoEmitOnErrorsPlugin()
    )

    if (options.minimize) {
      webpackConfig.plugins.push(
        new webpack.optimize.UglifyJsPlugin({
          sourceMap: Boolean(options.sourceMap),
          compressor: {
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
          },
          output: {
            comments: false
          }
        })
      )
    }

    // Do not split vendor in `cjs` and `umd` format
    if (options.vendor && !options.format) {
      // webpackConfig.plugins.push(new webpack.optimize.CommonsChunkPlugin({
      //   name: 'vendor',
      //   minChunks: module => {
      //     return module.resource && /\.(js|css|es6)$/.test(module.resource) && module.resource.indexOf('node_modules') !== -1
      //   }
      // }))
      webpackConfig.plugins.push(new webpack.optimize.CommonsChunkPlugin({
        name: 'manifest'
      }))
      // if (typeof webpackConfig.entry === 'object')
      // for (let k in webpackConfig.entry) {
      // }
    }
  }

  webpackConfig.module.rules.push({
    test: /\.(ico|jpg|png|gif|eot|otf|webp|ttf|woff|woff2)(\?.*)?$/,
    loaders: moduleImage
  })
  // ...
  // plugins: [new BundleAnalyzerPlugin()]
  // merge webpack config
  if (typeof options.webpack === 'function') {
    webpackConfig = options.webpack(webpackConfig, webpack, webpackMerge.smart)
  } else if (typeof options.webpack === 'object') {
    webpackConfig = webpackMerge.smart(webpackConfig, options.webpack)
  }
  // console.log(JSON.stringify(webpackConfig))
  return run(webpackConfig, options)
}

function getFilenames(options) {
  const excludeHash = options.dev || options.format
  return Object.assign({
    js: excludeHash ? '[name].js' : '[name].js?[chunkhash:8]',
    css: excludeHash ? '[name].css' : '[name].css?[contenthash:8]',
    static: excludeHash ? '[name].[ext]' : '[name].[ext]?[hash:8]',
    chunk: excludeHash ? '[name].js' : '[name].js?[chunkhash]',
  }, options.filename)
}
