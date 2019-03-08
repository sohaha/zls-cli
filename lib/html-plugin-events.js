// MyPlugin.js

function MyPlugin(options) {
}

MyPlugin.prototype.apply = function (compiler) {
  var self = this;
  let polyfill = false;
  let firstKey = '';
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-before-html-generation', function (htmlPluginData, callback) {
      for (let key in htmlPluginData.assets.chunks) {
        if (!firstKey) firstKey = htmlPluginData.assets.chunks[key].entry;
        if (key === 'polyfill') {
          polyfill = htmlPluginData.assets.chunks['polyfill'].entry;
        }
      }
      callback(null, htmlPluginData);
    });

    compilation.plugin('html-webpack-plugin-alter-asset-tags', function (htmlPluginData, callback) {
      if (!!polyfill) {
        if (!htmlPluginData['body']) htmlPluginData['body'] = [];
        let bodyData = htmlPluginData['body'];
        let newBodyData = [];
        for (let key in bodyData) {
          if (bodyData[key]['attributes']['src'] === firstKey) {
            newBodyData.push(bodyData[key]);
            newBodyData.push({
              'tagName': 'script',
              'closeTag': true,
              'attributes': {
                'type': 'text/javascript'
              },
              'innerHTML': `window['Promise'] || document.write('<script src="${polyfill}" rel="preload" as="script"><\\\/script>');`
            });
          } else if (bodyData[key]['attributes']['src'] !== polyfill) {
            newBodyData.push(bodyData[key]);
          }
        }
        htmlPluginData['body'] = newBodyData;
      }
      callback(null, htmlPluginData);
    });

    compilation.plugin('html-webpack-plugin-before-html-processing', function (htmlPluginData, callback) {
      callback(null, htmlPluginData);
    });
  });

};

module.exports = MyPlugin;
