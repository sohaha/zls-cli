/**
 * Created by 影浅-seekwe@gmail.com on 2018-06-27
 */
const path = require('path');
const safe = require('postcss-safe-parser');
module.exports = function () {
  let opt = {
    entry: 'index.js',
    dist: 'dist',
    host: '0.0.0.0',
    port: 3789,
    entryDefault: 'client',
    distHtml: '',
    exportStaticImage: false,
    alias: {},
    preload: false,
    includeModules: false,
    px2rem: false,
    cleanDist: true,
    target: 'web',
    postcss: {
      plugins: []
    },
    minimize: true,
    // sourceMap:false,
    autoprefixer: {},
    externals: {},
    externalsCdn: [],
    rootDirectory: 'src',
    exportStatic: '/',
    urlLimit: 5000,
    analyzer: false,
    polyfill: '//cdn.polyfill.io/v2/polyfill.min.js?features=es6',
    openBrowser: true,
    html: {},
    eslintConfig: {},
    eslintFix: false,
    import: false,
    babelPresetEnv: {
      modules: false,
      targets: {
        browsers: ['ie > 9', 'Android >= 4.0', 'iOS >= 8', '> 1%'],
        uglify: true
      },
      // useBuiltIns: true,
      useBuiltIns: 'usage',
      debug: false
    },
    less: {
      modifyVars: '',
      javascriptEnabled: true
    },
    sass: {
      indentedSyntax: true
    },
    vue: {
      jsx: false,
      templateCompiler: false,
      loader: {}
    },
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
        manifests: {
          name: 'manifests',
          minChunks: Infinity
        }
      }
    },
    stats: 'verbose' || {
      chunks: true,
      children: true,
      modules: true,
      colors: true,
      assets: true,
      cachedAssets: true,
      errorDetails: true,
      maxModules: Infinity,
      // Display bailout reasons
      optimizationBailout: true
    }
  };
  // noinspection JSUnresolvedVariable
  opt.babel = {
    plugins: [
      [
        require.resolve('babel-plugin-transform-runtime'),
        {
          helpers: true,
          polyfill: true,
          regenerator: true,
          moduleName: path.dirname(require.resolve('babel-runtime/package'))
        }
      ]
      // require.resolve('babel-plugin-syntax-dynamic-import')
      // require.resolve('babel-plugin-transform-vue-jsx')
    ],
    cacheDirectory: true,
    presets: [],
    babelrc: false,
    comments: true
  };

  return opt;
};
