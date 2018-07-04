/**
 * Created by 影浅-seekwe@gmail.com on 2018-06-27
 */
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

function cssLoaders(options, postcssOptions) {
  const cssLoader = [{
    loader: 'css-loader',
    options: {
      // modules: true,
      minimize: !!options.minimize,
      sourceMap: options.sourceMap,
      alias: options.alias
    }
  },
    {
      loader: 'postcss-loader',
      options: Object.assign({ sourceMap: options.sourceMap }, postcssOptions)
    }
  ]

  function generateLoaders(loader, loaderOptions) {
    const loaders = [].concat(cssLoader)
    if (loader) {
      loaders.push({
        loader: loader + '-loader',
        options: Object.assign({}, loaderOptions, {
          sourceMap: options.sourceMap
        })
      })
    }

    if (options.extract) {
      return ['vue-style-loader', MiniCssExtractPlugin.loader].concat(loaders)
    } else {
      return ['vue-style-loader'].concat(loaders)
    }
  }

  return {
    css: generateLoaders(),
    postcss: generateLoaders(),
    less: generateLoaders('less'),
    sass: generateLoaders('sass', { indentedSyntax: true }),
    scss: generateLoaders('sass'),
    stylus: generateLoaders('stylus'),
    styl: generateLoaders('stylus')
  }
}

function styleLoaders(options, postcssOptions) {
  const output = []
  const loaders = cssLoaders(options, postcssOptions)
  for (const extension in loaders) {
    if (loaders.hasOwnProperty(extension)) {
      const loader = loaders[extension]
      output.push({
        test: new RegExp('\\.' + extension + '$'),
        use: loader
      })
    }
  }
  return output
}

exports.cssLoaders = cssLoaders
exports.styleLoaders = styleLoaders
