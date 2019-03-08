const packager = require('electron-packager');
const path = require('path');
const $ = require('shelljs');
const fs = require('fs');

// "win32": "zls -c && electron-packager app my-app --out=./dist --platform=win32 --arch=x64 --version=1.0.0 --icon=./icon/icon --asar=false --overwrite --download.mirror=https://npm.taobao.org/mirrors/electron/  --win32metadata.FileDescription=desktop-app --win32metadata.ProductName=zls --win32metadata.CompanyName=seekwe --win32metadata.OriginalFilename=73zls.exe --production",
let appPath = path.join(__dirname, 'app');
let buildPath = path.join(__dirname, 'build');
let toolsPath = path.join(__dirname, 'tools');
let options = {
  name: 'zls',
  asar: false,
  prune: true,
  dir: appPath,
  icon: './app/icons/icon',
  ignore: /\b(src|index\.ejs)\b/,
  out: buildPath,
  overwrite: true,
  download: {
    mirror: 'https://npm.taobao.org/mirrors/electron/'
  },
  platform: process.env.PLATFORM_TARGET || 'all',
  appVersion: process.env.VERSION || '1.0.0',
  arch: process.env.ARCH || 'x64'
};

// $.cp(path.join(__dirname, 'z.js'), path.join(dir, 'dd'))

//$.mkdir('D:/seekwe/vagrant/seekwe/z/app/livechat/build/zls-app-win32-x64/resources/app/')
//$.cp('-Rf', 'D:/seekwe/vagrant/seekwe/z/app/livechat/app/node_modules', 'D:/seekwe/vagrant/seekwe/z/app/livechat/build/zls-app-win32-x64/resources/app/node_modules')

// function exists(path) {
//   return fs.existsSync(path);
// }

// function isDir(path) {
//   return exists(path) && fs.statSync(path).isDirectory();
// }

// function isFile(path) {
//   return exists(path) && fs.statSync(path).isFile();
// }

// function readdir(path, fn) {
//   fs.readdir(filesPath, function (err, files) {
//     if (err) {
//       console.log(err);
//       return;
//     }
//     if (typeof fn == 'function') fn(files)

//   });
// }

function cpFile(filesPath, buildPath) {

  fs.readdir(filesPath, function (err, files) {
    if (err) {
      console.log(err);
      return;
    }
    files.forEach(function (filename) {
      if ('dist' !== filename.trim()) {
        $.cp('-Rf', path.join(filesPath, filename), path.join(buildPath, filename));
      }
    });
  });

}

packager(options, function done_callback(err, appPaths) {
  if (!err) {
    appPaths.forEach(function (filesPath) {
      // let outpath = filesPath + '/resources/app'
      // $.mkdir(outpath)
      // cpFile(appPath, outpath)
      let outpath = filesPath + '/resources/tools';
      $.mkdir(outpath);
      cpFile(toolsPath, outpath);
    });
  } else {
    console.error(err);
  }
});
