/**
 * Created by 影浅-seekwe@gmail.com on 2018-06-27
 */
const fs = require('fs');
const path = require('path');
const sep = path.sep;
const chalk = require('chalk');
const webpack = require('webpack');  // https://webpack.js.org
const HtmlPlugin = require('html-webpack-plugin');
const PostCompilePlugin = require('post-compile-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const isYarn = require('installed-by-yarn-globally');
const userHome = require('user-home');
const webpackMerge = require('webpack-merge');
// const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader');
// const InterpolateHtmlPlugin = require('./html/interpolate-html')
const InterpolateCdnPlugin = require('./html/interpolate-cdn');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const WebpackBar = require('webpackbar');
// const NpmInstallPlugin = require('webpack-plugin-install-deps')
const {
  cwd,
  ownDir,
  fsExistsSync,
  getPublicPath,
  getFilenames
} = require('./utils');
const run = require('./run');
const loaders = require('./loaders');
const AppError = require('./app-error');
const appEnv = require('./env');

module.exports = function (options = {}, defaultOpt, cb) {
  // eslint-disable-line complexity
  console.log('> Starting...');

  let { env, stringifiedEnv } = appEnv(options);

  env.NODE_ENV = options.dev ? 'development' : 'production';
  if (options.dev) {
    options['entryDefault'] = defaultOpt['entryDefault'];
  }

  options.babel.presets.push([require.resolve('babel-preset-env'), options.babelPresetEnv]);
  options.babel.presets.push(require.resolve('babel-preset-stage-2'));

  if (options.vue.jsx) {
    options.babel.plugins.push(require.resolve('babel-plugin-transform-vue-jsx'));
  }

  if (typeof options.import === 'object') {
    options.babel.plugins.push([require.resolve('babel-plugin-import'), options.import]);
  }

  if (typeof options['hmrEntry'] === 'object' && options['hmrEntry'].length > 0) {

  } else if (typeof options['entry'] === 'string') {
    options['hmrEntry'] = [options['entryDefault']];
  } else {
    options['hmrEntry'] = [];
    for (let k in options['entry']) {
      if (options['entry'].hasOwnProperty(k)) {
        options['hmrEntry'].push(k);
      }
    }
  }

  // 历史问题
  options.exportStatic = options.cdnPath || options.exportStatic;
  options.exportStaticImage = options.cdnImagePath || options.exportStaticImage;

  const hmrEntry = options.hmrEntry;

  const isMultipleHtml = hmrEntry.length > 1;
  let distHtml = options.dev ?
    '' :
    options.distHtml ? cwd(options.distHtml) + '/' : '';

  let postcssOptions = options.postcss;

  let defaultPostcssPlugins = [
    require('autoprefixer')(
      Object.assign({
          browsers: ['ie > 9', 'Android >= 4.0', 'iOS >= 8', '> 1%']
        },
        options.autoprefixer
      )
    )
  ];

  if (options.px2rem) {
    let defaultPx2remOptions = {
      baseDpr: 1,
      remUnit: options.px2rem === 'number' ? options.px2rem : 100,
      keep1px: true
    };
    let px2remOptions =
      options.px2rem === true ?
        defaultPx2remOptions :
        Object.assign(defaultPx2remOptions, options.px2rem);

    defaultPostcssPlugins.push(require('zls-px2rem-loader')(px2remOptions));
  }

  postcssOptions.plugins = [].concat(postcssOptions.plugins || [], defaultPostcssPlugins);

  if (options.entry === 'index.js' && !fs.existsSync(options.entry)) {
    throw new AppError(
      `Entry file ${chalk.yellow(
        options.entry
      )} does not exist, did you forget to create one?`
    );
  }

  let minimizer = [];
  if (options.dev) {
    options = Object.assign({
        vendor: true,
        host: 'localhost',
        port: 3780,
        hot: true,
        hmrEntry: hmrEntry,
        sourceMap: 'eval-source-map'//'source-map'//'cheap-module-eval-source-map'//'eval-source-map'//'inline-source-map'
      },
      options
    );
    options.minimizeCss = false;
    options.minimizeJS = false;
    options.minimizeHtml = false;
  } else {
    options = Object.assign({
        vendor: true,
        minimize: true,
        sourceMap: 'source-map',
        extract: true
      },
      options
    );
    options.minimizeCss = typeof options.minimizeCss !== 'undefined' ? options.minimizeCss : options.minimize;
    options.minimizeJS = typeof options.minimizeJS !== 'undefined' ? options.minimizeJS : options.minimize;
    options.minimizeHtml = typeof options.minimizeHtml !== 'undefined' ? options.minimizeHtml : (!!options.minimize ? {
      minifyCSS: true,
      minifyJS: true,
      processConditionalComments: true,
      removeAttributeQuotes: true,
      removeStyleLinkTypeAttributes: true,
      removeComments: true,
      collapseWhitespace: true
    } : {});
  }

  options.alias = Object.assign({
      '@': cwd(options.rootDirectory),
      '~': cwd(options.rootDirectory)
    },
    options.alias
  );
  const filename = getFilenames(options);
  const cssOptions = {
    extract: !options.dev && !!options.extract,
    sourceMap: Boolean(options.sourceMap),
    cssModules: options.cssModules,
    minimize: !options.dev && !!options.minimizeCss,
    alias: (e => {
      let alias = {};
      for (let k in e) {
        if (e.hasOwnProperty(k)) {
          let key = k.indexOf('./') === 0 ? k : './' + k;
          alias[key] = e[k];
        }
      }
      return alias;
    })(options.alias)
  };

  let nodeModulesPath = [cwd('node_modules'), ownDir('node_modules'), userHome + '/node_modules'];
  let publicPath = getPublicPath(options.cdnPath, options.dev, '/');
  let publicImagePath = options.cdnImagePath ?
    getPublicPath(options.cdnImagePath, options.dev) :
    publicPath;
  let cssLoader = loaders.styleLoaders(cssOptions, postcssOptions, options);
  let jsModuleInclude = (filepath) => {
    // return true
    if (filepath.split(/[/\\]/).indexOf('node_modules') === -1) {
      return true;
    }

    // options.transpileModules = [
    //   'zls-ui'
    // ]

    if (options.includeModules) {
      for (const name of options.includeModules) {
        if (
          filepath.indexOf(`${sep}node_modules${sep}${name}${sep}`) !==
          -1
        ) {
          return true;
        }
      }
    } else {
      return /\.vue\.js/.test(filepath);
    }
  };

  let webpackConfig = {
    context: cwd(),
    bail: !!options.dev,
    target: options.target,
    optimization: {
      runtimeChunk: { name: 'manifest' },
      splitChunks: options.splitChunks
    },
    mode: env.NODE_ENV,
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
      // pathinfo: true, // boolean
      // crossOriginLoading: "anonymous",
    },
    performance: {
      maxEntrypointSize: 750000,
      maxAssetSize: 750000,
      hints: options.dev ? false : 'warning',
      assetFilter: function (assetFilename) {
        return assetFilename.endsWith('.js');
      }
    },
    resolve: {
      extensions: ['.js', '.json', '.vue', '.css', '.jsx'],
      modules: [cwd(), ...nodeModulesPath],
      alias: Object.assign(options.vue ? {
          vue$: options.vue.templateCompiler ?
            'vue/dist/vue.esm.js' : 'vue/dist/vue.runtime.esm.js'
        } : {},
        options.alias
      )
    },
    resolveLoader: {
      modules: nodeModulesPath
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: options.babel
          },
          include: jsModuleInclude

        },
        {
          test: /\.jsx$/,
          use: {
            loader: 'babel-loader',
            options: options.babel
          },
          include: jsModuleInclude
        },
        {
          test: /\.es6$/,
          use: {
            loader: 'babel-loader',
            options: options.babel
          },
          include: jsModuleInclude
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
      new WebpackBar({
        name: 'zls-cli',
        // profile: true,
        compiledIn: false,
        minimal: false,
        done: function (sharedState, ctx) {
          // process.stdout.write('\x1Bc');
          let e = sharedState['zls-cli']['stats']['endTime'] - sharedState['zls-cli']['stats']['startTime'];
          console.log(`\n${chalk.bgGreen.white(' DONE ')} compiled in ${e}ms.\n`);
        }
      }),
      // new ProgressBarPlugin({
      //   format: '  build [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
      //   clear: true,
      //   // summary: false,
      //   customSummary: function (e) {
      //     process.stdout.write('\x1Bc');
      //     console.log(`${chalk.bgGreen.white(' DONE ')} Compiled successfully: ${e}.\n`);
      //   }
      // }),
      // new webpack.ProgressPlugin(function handler(percentage, msg) {
      //   process.stdout.write('\x1Bc')
      //   console.log((percentage.toFixed(2) * 100).toFixed(2) + '%', msg)
      // }),
      // new webpack.ProvidePlugin({
      // Promise: 'Promise'
      // }),
      // new FriendlyErrorsPlugin(),
      // new NpmInstallPlugin(),
      new PostCompilePlugin(stats => {
        cb(stats, options);
        // process.stdout.write('\x1Bc')
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
    ]
  };
  if (typeof options.entry === 'string') {
    webpackConfig.entry[defaultOpt['entryDefault']].push(options.entry);
  } else if (Array.isArray(options.entry)) {
    webpackConfig.entry[defaultOpt['entryDefault']] = options.entry;
  } else if (typeof options.entry === 'object') {
    webpackConfig.entry = options.entry;
  }

  if (options.vue !== false) {
    webpackConfig.plugins.push(new VueLoaderPlugin());
    webpackConfig.module.rules.push({
      test: /\.vue$/,
      loader: 'vue-loader',
      options: Object.assign({
        cacheBusting: true,
        cssSourceMap: true,
        transformToRequire: {
          video: ['src', 'poster'],
          source: 'src',
          img: 'src',
          image: 'xlink:href'
        }
      }, options.vue.loader)
    });
  }

  for (const entry of hmrEntry) {
    let entryVal = webpackConfig.entry[entry];
    if (typeof entryVal === 'string') {
      entryVal = [webpackConfig.entry[entry]];
    }
    if (options.vue !== false) {
      entryVal.unshift(ownDir('lib/vue.js'));
    }
    entryVal.push(ownDir('lib/after.js'));
    webpackConfig.entry[entry] = entryVal;
  }

  if (options.format === 'cjs') {
    webpackConfig.output.libraryTarget = 'commonjs2';
    Object.assign(webpackConfig.externals, {
      'webpack-node-externals': require('webpack-node-externals')(), vue: 'vue', 'babel-runtime': 'babel-runtime'
    });
  } else if (options.format === 'umd') {
    webpackConfig.output.libraryTarget = 'umd';
    webpackConfig.output.library = options.moduleName || '';
  } else if (options.format) {
    webpackConfig.output.libraryTarget = options.format;
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
    polyfill: !!options.polyfill,
    // excludeChunks: ['promise'],
    minify: options.minimizeHtml
  });

  let moduleImage = [{
    loader: 'url-loader',
    query: {
      limit: options.urlLimit,
      name: filename.static,
      publicPath: publicImagePath
    }
  }];

  let htmlConfig = {};

  if (options.html) {
    if (Array.isArray(options.html)) {
      htmlConfig = options.html.map(html => {
        if (!!html['filename']) html['filename'] = distHtml + html['filename'];
        return new HtmlPlugin(Object.assign({}, defaultHtmlConfig, html));
      });
    } else {
      if (!!options.html['filename'])
        options.html['filename'] = distHtml + options.html['filename'];

      if (hmrEntry.length > 1) {
        // 多页面
        htmlConfig = [];
        for (let k of hmrEntry) {
          htmlConfig.push(new HtmlPlugin(Object.assign({}, defaultHtmlConfig, { excludeChunks: hmrEntry.filter(v => v !== k), filename: distHtml + k + '.html' }, options.html)));
        }
      } else {
        htmlConfig = [
          new HtmlPlugin(Object.assign({}, defaultHtmlConfig, options.html))
        ];
      }
    }
    webpackConfig.plugins = webpackConfig.plugins.concat(htmlConfig);

  } else if (options.html !== false) {
    webpackConfig.plugins = webpackConfig.plugins.concat([
      new HtmlPlugin(defaultHtmlConfig)
    ]);
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
          useEslintrc: false,
          fix: options.eslintFix
        },
        options.eslintConfig
      )
    });
  }

  if (options.extract) {
    webpackConfig.plugins.push(
      new MiniCssExtractPlugin({
        filename: filename.css,
        chunkFilename: '[id].css',
        allChunks: true
      })
    );
  }

  if (isYarn(__dirname)) {
    webpackConfig.resolve.modules.push(ownDir('..'));
    webpackConfig.resolveLoader.modules.push(ownDir('..'));
  }

  if (options.dev) {
    if (options.hot && !options.watch) {
      for (const entry of hmrEntry) {
        webpackConfig.entry[entry] = Array.isArray(webpackConfig.entry[entry]) ?
          webpackConfig.entry[entry] : [webpackConfig.entry[entry]];
        webpackConfig.entry[entry].unshift(ownDir('lib/client.es6'));
      }
      webpackConfig.plugins.push(new webpack.NamedModulesPlugin());
      webpackConfig.plugins.push(new webpack.NoEmitOnErrorsPlugin());
      webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
    }

  } else {
    if (options.preload && !isMultipleHtml) {
      const PreloadWebpackPlugin = require('preload-webpack-plugin');
      let preload = typeof options.preload === 'object' ? options.preload : {
        rel: 'preload',
        as(entry) {
          if (/\.css(\?|$)/.test(entry)) return 'style';
          if (/\.(woff|ttf|woff2)(\?|$)/.test(entry)) return 'font';
          if (/\.(png|jpg|gif)(\?|$)/.test(entry)) return 'image';
          return 'script';
        },
        include: 'initial',
        fileBlacklist: [/\.(map)(\?|$)/, /base?.+/]
      };
      webpackConfig.plugins.push(new PreloadWebpackPlugin(preload));
      webpackConfig.plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
      // noinspection JSUnresolvedFunction
      webpackConfig.plugins.push(new webpack.NamedChunksPlugin());
    }

    if (options.minimizeImage === true) {
      moduleImage.push({
        loader: 'image-webpack-loader'
      });
    } else if (typeof options.minimizeImage === 'object') {
      moduleImage.push(options.minimizeImage);
    }

    if (options.analyzer) {
      if (typeof options.analyzer === 'boolean') {
        webpackConfig.plugins.push(new BundleAnalyzerPlugin());
      } else {
        webpackConfig.plugins.push(new BundleAnalyzerPlugin(options.analyzer));
      }
    }
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
        };
    const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
    minimizer.push(
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: Boolean(options.sourceMap),
        uglifyOptions: {
          compress: compressor
        }
      })
    );

  } else {
    // webpackConfig.optimization.minimize = false
  }

  if (options.minimizeCss) {
    minimizer.push(new OptimizeCSSPlugin({
      cssProcessorOptions: { discardComments: { removeAll: true } }
      // canPrint: true
    }));
  }

  // copy ./static/** to dist folder
  let copyConfig;
  if (typeof options.copy === 'object') {
    copyConfig = options.copy;
  } else if (!options.copy) {
    if (fs.existsSync('static')) {
      copyConfig = [{
        from: 'static',
        to: 'static'//cwd(options.dist)
      }];
    }
  }

  if (copyConfig) webpackConfig.plugins.push(new CopyPlugin(copyConfig));
  if (options.vendor && !options.format) {
    // Do not split vendor in `cjs` and `umd` format
    // webpackConfig.plugins.push(new webpack.optimize.CommonsChunkPlugin({
    //   name: 'vendor',
    //   minChunks: module => {
    //     return module.resource && /\.(js|css|es6)$/.test(module.resource) && module.resource.indexOf('node_modules') !== -1
    //   }
    // }))
    /*webpackConfig.plugins.push(
     new webpack.optimize.CommonsChunkPlugin({
     name: "manifest"
     })
     ) */
    // if (typeof webpackConfig.entry === 'object')
    // for (let k in webpackConfig.entry) {
    // }

    // if (options.promise === true) {
    //   webpackConfig.entry['promise'] = require.resolve(
    //     'es6-promise/dist/es6-promise.auto.min.js'
    //   )
    // } else if (!!options.promise) {
    //   webpackConfig.entry['promise'] = options.promise
    // }
  }

  webpackConfig.module.rules.push({
    test: /\.(ico|jpg|png|gif|eot|otf|webp|ttf|woff|woff2)(\?.*)?$/,
    loaders: moduleImage
  });

  // options.lib = !!options.format

  // 注入环境变量
  // webpackConfig.plugins.push(new InterpolateHtmlPlugin(env))
  if (!options.dev) {
    webpackConfig.plugins.push(new InterpolateCdnPlugin({
        modules: options.externalsCdn,
        polyfill: options.polyfill === true ? '//cdn.jsdelivr.net/npm/es6-promise@4.2.4/dist/es6-promise.auto.min.js' : options.polyfill
        // prod: !options.dev
      }
    ));
  }
  webpackConfig.optimization.minimizer = minimizer;
  // merge webpack config
  if (typeof options.webpack === 'function') {
    webpackConfig = options.webpack(webpackConfig, webpack, webpackMerge.smart);
  } else if (typeof options.webpack === 'object') {
    webpackConfig = webpackMerge.smart(webpackConfig, options.webpack);
  }
  // console.log(JSON.stringify(options.babel.plugins))
  // console.log(JSON.stringify(webpackConfig))
  return run(webpackConfig, options);
};

