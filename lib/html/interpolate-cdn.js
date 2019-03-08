/**
 * Created by 影浅-seekwe@gmail.com on 2018-06-27
 */
const fs = require('fs');
const path = require('path');
const empty = '';
const slash = '/';
const packageJson = 'package.json';
const paramsRegex = /:([a-z]+)/gi;
const DEFAULT_MODULE_KEY = 'defaultCdnModuleKey____';
const {
  cwd,
  ownDir,
  fsExistsSync,
  getPublicPath,
  getFilenames
} = require('../utils');

class InterpolateCdnPlugin {
  constructor({
                modules,
                prod,
                prodUrl = 'https://cdn.jsdelivr.net/npm/:name@:version/:path',
                devUrl = ':name/:path',
                publicPath,
                polyfill,
                optimize = false
              }) {
    this.modules = Array.isArray(modules) ? { [DEFAULT_MODULE_KEY]: modules } : modules;
    this.prod = prod !== false;
    this.prefix = publicPath;
    this.url = this.prod ? prodUrl : devUrl;
    this.optimize = optimize;
    this.polyfill = polyfill;
  }

  apply(compiler) {
    const { output } = compiler.options;
    output.publicPath = output.publicPath || '/';

    if (output.publicPath.slice(-1) !== slash) {
      output.publicPath += slash;
    }

    this.prefix = this.prod ? empty : this.prefix || output.publicPath;

    if (!this.prod && this.prefix.slice(-1) !== slash) {
      this.prefix += slash;
    }

    const getArgs = [this.url, this.prefix, this.prod, output.publicPath];

    compiler.hooks.compilation.tap('InterpolateCdnPlugin', (compilation) => {
      compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync('InterpolateCdnPlugin', (data, callback) => {
        const moduleId = data.plugin.options.cdnModule;
        if (moduleId !== false) {
          let modules = this.modules[moduleId || Reflect.ownKeys(this.modules)[0]];
          if (modules) {
            if (this.optimize) {
              const usedModules = InterpolateCdnPlugin._getUsedModules(compilation);
              modules = modules.filter(p => usedModules[p.name]);
            }

            InterpolateCdnPlugin._cleanModules(modules);

            data.assets.js = InterpolateCdnPlugin._getJs(modules, ...getArgs).concat(data.assets.js);
            data.assets.css = InterpolateCdnPlugin._getCss(modules, ...getArgs).concat(data.assets.css);
          }
        }

        callback(null, data);
      });

      // if ('htmlWebpackPluginBeforeHtmlProcessing' in compilation.hooks) {}
      compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tapAsync('InterpolateCdnPlugin', (data, callback) => {
        const moduleId = data.plugin.options.cdnModule;
        let links = [];
        if (this.polyfill) {
          let a = encodeURIComponent(`<script src='${this.polyfill}'></script>`);
          let p = '  <script>window[\'Promise\'] || document.write(decodeURIComponent("' + a + '"))</script>\n';
          links.push(p);
        }
        if (moduleId !== false) {
          let modules = this.modules[moduleId || Reflect.ownKeys(this.modules)[0]];
          let fonts = InterpolateCdnPlugin._getFont(modules, ...getArgs);

          fonts.forEach(s => {
            links.push(`<link rel="preload" href="${s}" as="font" crossorigin>\n`);
          });
          //preload
        }
        if (links.length > 0) {
          data.html = InterpolateCdnPlugin._insertLinksIntoHead({
            html: data.html,
            links
          });
        }
        callback(null, data);
      });
    });

    const externals = compiler.options.externals || {};

    Reflect.ownKeys(this.modules).forEach((key) => {
      const mods = this.modules[key];
      mods.forEach((p) => {
        externals[p.name] = p.var || p.name;
      });
    });

    compiler.options.externals = externals;
  }

  static getModules(name) {
    let cwdPath = path.join(cwd('node_modules'), name);
    let ownDirPath = path.join(ownDir('node_modules'), name);
    let res;
    if (fs.existsSync(cwdPath)) {
      res = cwdPath;
    } else if (fs.existsSync(ownDirPath)) {
      res = ownDirPath;
    } else {
      throw ('modules: ' + name + ' not exist');
    }
    return res;
  }

  static getVersion(name) {
    return require(this.getModules(name) + '/' + packageJson).version;
  }

  static _getUsedModules(compilation) {
    let usedModules = {};

    compilation.getStats().toJson().chunks.forEach(c => {
      c.modules.forEach(m => {
        m.reasons.forEach(r => {
          usedModules[r.userRequest] = true;
        });
      });
    });

    return usedModules;
  }

  static _cleanModules(modules) {
    modules.forEach(p => {
      p.version = InterpolateCdnPlugin.getVersion(p.name);

      if (!p.paths) {
        p.paths = [];
      }
      if (p.path) {
        p.paths.unshift(p.path);
        p.path = undefined;
      }
      if (p.paths.length === 0 && !p.cssOnly) {
        let path = InterpolateCdnPlugin.getModules(p.name);

        p.paths.push(require.resolve(path).match(/.*[\\/]node_modules[\\/].+?[\\/](.*)$/)[1].replace(/\\/g, '/'));
      }
      if (!p.fonts) {
        p.fonts = [];
      }
      if (p.font) {
        p.fonts.unshift(p.fonts);
        p.font = undefined;
      }
      if (!p.styles) {
        p.styles = [];
      }
      if (p.style) {
        p.styles.unshift(p.style);
        p.style = undefined;
      }
    });
  }

  static _insertLinksIntoHead({
                                html,
                                links = []
                              }) {
    if (links.length === 0) {
      return html;
    }
    if (html.includes('</head>')) {
      // If a valid closing </head> is found, insert the new <link>s right before it.
      return html.replace('</head>', links.join('') + '</head>');
    }

    if (html.includes('<body>')) {
      // If there's a <body> but no <head>, create a <head> containing the <head>.
      return html.replace('<body>', `<head>${links.join('')}\n</head><body>`);
    }

    throw new Error(`The HTML provided did not contain a </head> or a <body>:\n\n${html}`);
  }

  static _getFont(modules, url, prefix, prod, publicPath) {
    return InterpolateCdnPlugin._get(modules, url, prefix, prod, publicPath, 'fonts', 'localStyle');
  }

  static _getCss(modules, url, prefix, prod, publicPath) {
    return InterpolateCdnPlugin._get(modules, url, prefix, prod, publicPath, 'styles', 'localStyle');
  }

  static _getJs(modules, url, prefix, prod, publicPath) {
    return InterpolateCdnPlugin._get(modules, url, prefix, prod, publicPath, 'paths', 'localScript');
  }

  static _get(modules, url, prefix, prod, publicPath, pathsKey, localKey) {

    prefix = prefix || empty;
    prod = prod !== false;

    let files = [];

    modules.filter(p => p[localKey]).forEach(p => files.push(publicPath + p[localKey]));

    modules.filter(p => p[pathsKey].length > 0).forEach(p => {
      p[pathsKey].forEach(s => {
          let res = InterpolateCdnPlugin._isUrl(s) ? s : url.replace(paramsRegex, (m, p1) => {
            let r = '';
            if (prod && p.cdn && p1 === 'name') {
              r = p.cdn;
            } else {
              r = p1 === 'path' ? s : p[p1];
            }
            return prefix + r;
          });
          files.push(res);
        }
      );
    });
    return files;
  }

  static _isUrl(path) {
    return /^((https:\/|http:\/|\/)\/)/.test(path);
  }
}

module.exports = InterpolateCdnPlugin;
