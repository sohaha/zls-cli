/**
 * Created by 影浅-seekwe@gmail.com on 2018-06-27
 */
const path = require('path')

module.exports = function () {
  return {
    entry: 'index.js',
    dist: 'dist',
    entryDefault: 'client',
    distHtml: '',
    cdnImagePath: false,
    alias: {},
    preload: true,
    templateCompiler: false,
    transpileModules: false,
    px2rem: false,
    postcss: {
      plugins: []
    },
    minimize: true,
    // sourceMap:false,
    autoprefixer: {},
    externals: {},
    externalsCdn: [],
    rootDirectory: 'src',
    cdnPath: '/',
    urlLimit: 5000,
    analyzer: false,
    promise: true,
    openBrowser: true,
    html: {},
    babel: {
      plugins: [
        require.resolve('babel-plugin-syntax-dynamic-import'),
        [
          require.resolve('babel-plugin-transform-runtime'),
          {
            helpers: true,
            polyfill: true,
            regenerator: true,
            // Resolve the Babel runtime relative to the config.
            moduleName: path.dirname(require.resolve('babel-runtime/package'))
          }
        ],
        require.resolve('babel-plugin-transform-vue-jsx')
      ],
      cacheDirectory: true,
      presets: [
        [
          require.resolve('babel-preset-env'),
          {
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
}
