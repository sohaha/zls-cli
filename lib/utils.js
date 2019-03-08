const path = require('path');
const fs = require('fs');

exports.cwd = function (...args) {
  return path.resolve(...args);
};

exports.ownDir = function (...args) {
  return path.join(__dirname, '../', ...args);
};

exports.getConfigFile = function (config) {
  if (!config) {
    return;
  }
  if (config === true) {
    return exports.cwd('zls.config.js');
  }
  return exports.cwd(config);
};

exports.getPublicPath = function (path, dev, path2) {
  if (!dev && path) {
    return /\/$/.test(path) ? path : (path + '/');
  }
  return typeof (path2) !== 'undefined' ? path2 : '/';
};
exports.getFilenames = function (options) {
  const excludeHash = options.dev || options.format;
  let filename = Object.assign({
      js: excludeHash ? '[name].js' : '[name].js?v=[contenthash:8]',
      css: excludeHash ? '[name].css' : '[name].css?v=[contenthash:8]',
      static: excludeHash ? '[name].[ext]' : 'static/[name].[ext]?v=[hash:8]',
      html: '[name].html',
      chunk: excludeHash ? '[name].chunk.js' : '[name].chunk.js?v=[contenthash:8]'//chunkhash
    },
    options.filename
  );
  if (/.*\.css$/.test(filename.css)) {
    filename.css = filename.css + '?';
  }
  return filename;
};

exports.fsExistsSync = function (path) {
  try {
    fs.accessSync(path, fs.F_OK);
  }
  catch ( e ) {
    return false;
  }
  return true;
};
