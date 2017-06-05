'use strict';

module.exports = (function () {
  function PostCompile(fn) {
    this.fn = fn;
  }

  PostCompile.prototype.apply = function apply (compiler) {
    var this$1 = this;

    compiler.plugin('done', function (stats) {
      if (typeof this$1.fn === 'function') {
        this$1.fn(stats);
      }
    });
  };

  return PostCompile;
}());
