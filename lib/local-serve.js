/**
 * Created by 影浅-seekwe@gmail.com on 2018-08-21
 */
const http = require('http');
const path = require('path');
const fs = require('fs');
const dns = require('dns');
const { promisify } = require('util');
const { parse } = require('url');
const os = require('os');
const meow = require('meow');
const getPort = require('get-port');
const chalk = require('chalk');
const handler = require('serve-handler');
// const readFile = promisify(fs.readFile)
const warning = (message) => chalk`{yellow WARNING:} ${message}`;
const info = (message) => chalk`{magenta INFO:} ${message}`;
const error = (message) => chalk`{red ERROR:} ${message}`;

const registerShutdown = (fn) => {
  let run = false;
  const wrapper = () => {
    if (!run) {
      run = true;
      fn();
    }
  };

  process.on('SIGINT', wrapper);
  process.on('SIGTERM', wrapper);
  process.on('exit', wrapper);
};

const startEndpoint = (endpoint, config, args) => {
  const server = http.createServer((request, response) => handler(request, response, config));
  let lookup = promisify(dns.lookup);

  server.on('error', (err) => {
    console.error(error(`Failed to serve: ${err.stack}`));
    process.exit(1);
  });

  server.listen(...endpoint, async () => {
    const details = server.address();
    registerShutdown(() => server.close());
    let localAddress = null;

    if (typeof details === 'string') {
      localAddress = details;
    } else if (typeof details === 'object' && details.port) {
      const address = details.address === '::' ? 'localhost' : details.address;
      localAddress = `http://${address}:${details.port}`;
    }
    const suffix = localAddress ? `${localAddress}` : '';
    console.log(chalk.bold(`${chalk.bgCyan.white(' Local ')} ${suffix}`));
    lookup(os.hostname()).then(e => {
      const { address } = e;
      if (address !== '127.0.0.1')
        console.log(`\n${chalk.bgYellow.white('  Net  ')} http://${address}:${details.port}`);
    });
  });
};

module.exports = function () {
  const cli = meow(`
    ${chalk.bold('Options:')}
    ${chalk.yellow('-P, --port')}            ${chalk.dim('Port')}
    ${chalk.yellow('-N, --No')}            ${chalk.dim('Not Auto Open Browser')}
\t`, {
    booleanDefault: undefined,
    flags: {
      port: {
        alias: 'P',
        default: 5000
      },
      no: {
        alias: 'N',
        default: false
      }
    }
  });

  let args = {
    port: cli.flags['port'],
    noOpen: cli.flags['no']
  };

  getPort({ port: args.port }).then(port => {
    if (args.port !== port) {
      console.log(warning(`Port ${args.port} has been used, switched to ${port}.\n`));
    }
    startEndpoint([port], {
      public: cli.input[1] || '',
      source: '**',
      destination: '/index.html'
    }, args);
  });

  registerShutdown(() => {
    process.on('SIGINT', () => {
      console.log(`\n${warning('Force-closing all open sockets...')}`);
      process.exit(0);
    });
  });
};
