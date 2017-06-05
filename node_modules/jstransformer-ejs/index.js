'use strict';

var ejs = require('ejs');
var fs  = require('fs');

exports.name = 'ejs';
exports.outputFormat = 'html';
exports.compile = ejs.compile;
exports.compileClient = function (source, options) {
  options = options || {};
  options.client = true;
  return exports.compile(source, options).toString();
};
exports.compileFile = function (path, options) {
  options = options || {};
  options.filename = options.filename || path;
  return exports.compile(fs.readFileSync(path, 'utf8'), options);
};
