/**
 * Created by 影浅-seekwe@gmail.com on 2018-06-27
 */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

function cssLoaders(options, postcssOptions, globalOptions) {
  const cssLoader = [
    {
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
  ];

  function generateLoaders(loader, loaderOptions) {
    const loaders = [].concat(cssLoader);
    if (loader) {
      loaders.push({
        loader: loader + '-loader',
        options: Object.assign({}, loaderOptions, {
          sourceMap: options.sourceMap
        })
      });
    }

    if (options.extract) {
      return ['vue-style-loader', MiniCssExtractPlugin.loader].concat(loaders);
    } else {
      return ['vue-style-loader'].concat(loaders);
    }
  }

  return {
    css: generateLoaders(),
    postcss: generateLoaders(),
    less: generateLoaders('less', globalOptions.less),
    sass: generateLoaders('sass', globalOptions.sass),
    scss: generateLoaders('sass', globalOptions.scss),
    stylus: generateLoaders('stylus', globalOptions.stylus),
    styl: generateLoaders('stylus', globalOptions.stylus)
  };
}

function styleLoaders(options, postcssOptions, globalOptions) {
  const output = [];
  const loaders = cssLoaders(options, postcssOptions, globalOptions);
  for (const extension in loaders) {
    if (loaders.hasOwnProperty(extension)) {
      const loader = loaders[extension];
      output.push({
        test: new RegExp('\\.' + extension + '$'),
        use: loader
      });
    }
  }
  return output;
}

exports.cssLoaders = cssLoaders;
exports.styleLoaders = styleLoaders;
