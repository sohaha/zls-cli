const path = require('path');
const http = require('http');
const chalk = require('chalk');
const rm = require('rimraf').sync;
const webpack = require('webpack');
const createServer = require('../lib/server');
const AppError = require('./app-error');

module.exports = function (webpackConfig, options) {
  process.stdout.write('\x1Bc');

  if (options.inspect) {
    console.log(webpackConfig);
  }

  const result = {
    webpackConfig,
    options
  };

  if (typeof options.run === 'function') {
    options.run(webpackConfig);
    return result;
  }

  let compiler;

  try {
    compiler = webpack(webpackConfig);
  }
  catch ( err ) {
    if (err.name === 'WebpackOptionsValidationError') {
      throw new AppError(err.message);
    } else {
      throw err;
    }
  }
  result.compiler = compiler;

  if (options.watch) {
    console.log('> Running in Watch mode:');
    // rm(path.join(options.dist, '*'))
    result.watcher = compiler.watch({}, (err, stats) => handleBuild(err, stats, true));
  } else if (options.dev) {
    console.log('> Running in Development mode:');
    const { app, devMiddleWare } = createServer(compiler, options);
    result.server = http.createServer(app);
    result.app = app;
    result.devMiddleWare = devMiddleWare;
  } else {
    console.log('> Creating an optimized production build:');
    if (options.cleanDist) rm(path.join(options.dist, '*'));
    compiler.run(handleBuild);
  }

  return result;

  function handleBuild(err, stats, watch) {
    if (err) {
      throw new AppError(err.stack);
    }
    if (stats.hasErrors()) {
      const failureMessage = `\n\n${chalk.bgRed.black(' ERROR ')} Compiling failed!\n`;
      const msg = stats.toString('errors-only') + failureMessage;
      return console.error(msg);
    } else if (stats.hasWarnings()) {
      const failureMessage = `\n\n${chalk.bgYellow.black(' Warning ')} File size is too large!\n`;
      const msg = stats.toString('minimal') + failureMessage;
      console.warn(msg);
    }
    // console.log(stats.toString(options.stats))
    // console.log(`\n${chalk.bgGreen.black(' DONE ')} Compiled successfully!\n`)
    if (!watch) {
      if (options.lib) {
        // console.log(`The ${chalk.cyan(options.dist)} folder is ready to be published.`)
        console.log(`       Make sure you have correctly set ${chalk.cyan('package.json')}\n`);
      } else {
        // console.log(`You may also serve it locally with a static server:\n`)
        // console.log(`  ${chalk.yellow('npm')} i -g serve`)
        // console.log(`  ${chalk.yellow('serve')} ${options.dist}\n`)
      }
    }
    console.log(`       Generated into ${chalk.cyan(options.dist)} folder.\n`);
  }
};
