/**
 * Created by 影浅-seekwe@gmail.com on 2018-08-24
 */
const install = require('yarn-install');
const userHome = require('user-home');
const { cwd, ownDir, fsExistsSync, getPublicPath } = require('../lib/utils');
const pathToPackage = require('global-modules-path');
const getArgValue = function (args) {
  let jumpKey = {};
  let value = [];
  for (let i = 0, length = args.length; i < length; i++) {
    let data = args[i];
    if (data && '-' === data[0]) {
      let key = data.substr(1);
      let value = args[++i];
      jumpKey[key] = typeof value === 'undefined' ? true : value;
    } else if (data) {
      value.push(data);
    }
  }

  return (key, d) => {
    if (!key) return value;
    if (typeof key === 'object') {
      for (let k of key) {
        let data = jumpKey[k];
        if (data !== 'undefined') {
          return data;
        }
      }
      return d;
    }
  };
};

module.exports = function (args) {
  let argv = getArgValue(args);
  let pkg = require(cwd() + '/package.json');
  let global = !!argv(['g', '-global', 'G'], false);
  let deps = [];
  let dependencies = argv();
  let installMode = false;
  if (dependencies.length <= 0) {
    dependencies = pkg.dependencies;
    for (let k in dependencies) {
      deps.push(k + '@' + dependencies[k]);
    }
  } else {
    deps = dependencies;
    installMode = true;
  }

  //userHome
  let o = {
    cwd: global ? userHome : cwd(),
    production: !installMode,
    dev: !!argv(['D', '-save-dev'], false),
    // global: global,
    showCommand: false,
    registry: argv('-registry', 'https://registry.npm.taobao.org')
  };

  try {
    install({ deps, ...o });
  }
  catch ( err ) {
    console.warn(err);
  }

};
