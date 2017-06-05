// MyPlugin.js

function MyPlugin(options) {}

MyPlugin.prototype.apply = function (compiler) {
  var self = this;
  let promise = false;
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-before-html-generation', function (htmlPluginData, callback) {
      for (var key in htmlPluginData.assets.chunks) {
        if (key === 'promise') {
          promise = htmlPluginData.assets.chunks['promise'].entry
          delete htmlPluginData.assets.chunks['promise']
        }
      }
      callback(null, htmlPluginData);
    });

    compilation.plugin('html-webpack-plugin-alter-asset-tags', function (htmlPluginData, callback) {
      if (!!promise) {
        if (!htmlPluginData['body']) htmlPluginData['body'] = []
        htmlPluginData['body'].unshift({
          "tagName": "script",
          "closeTag": true,
          "attributes": {
            "type": "text/javascript"
          },
          "innerHTML": `window['Promise'] || document.write('<script src="${promise}"><\\\/script>');`
        })
      }
      callback(null, htmlPluginData);
    });

    compilation.plugin('html-webpack-plugin-before-html-processing', function (htmlPluginData, callback) {
      callback(null, htmlPluginData);
    });
  });

};

module.exports = MyPlugin;
