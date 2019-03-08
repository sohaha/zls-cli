//npm i --dev inquirer is-binary-path jstransformer jstransformer-ejs majo minimatch multimatch path-exists

const fs = require('fs');
const path = require('path');
const majo = require('majo');
const match = require('minimatch');
const inquirer = require('inquirer');
const isBinaryPath = require('is-binary-path');
const exists = require('path-exists');
const tildify = require('tildify');
const $ = require('shelljs');

// forked from https://github.com/vuejs/vue-cli/blob/master/lib/eval.js

function evalualte(exp, data) {
  /* eslint-disable no-new-func */
  const fn = new Function('data', `with (data) { return ${exp} }`);
  try {
    return fn(data);
  }
  catch ( err ) {
    console.error(`Error when evaluating filter condition: ${exp}`);
  }
}

// forked from https://github.com/vuejs/vue-cli/blob/master/lib/filter.js
function filterFiles(filters) {
  return ctx => {
    if (!filters) {
      return;
    }

    if (typeof filters === 'function') {
      filters = filters(ctx.meta.merged);
    }

    const fileList = ctx.fileList;
    const data = ctx.meta.merged;

    Object.keys(filters).forEach(glob => {
      fileList.forEach(file => {
        if (match(file, glob, { dot: true })) {
          const condition = filters[glob];
          if (!evalualte(condition, data)) {
            ctx.deleteFile(file);
          }
        }
      });
    });
  };
}

function __async(g) {
  return new Promise(function (s, j) {
    function c(a, x) {
      let r = g[x ? 'throw' : 'next'](a);
      try {
      }
      catch ( e ) {
        j(e);
        return;
      }
      r.done ? s(r.value) : Promise.resolve(r.value).then(c, d);
    }

    function d(e) {
      c(e, 1);
    }

    c();
  });
}

function getMockedAnswers(mockPrompts, prompts) {
  return __async(function* () {
    const answers = {};

    let i = 0, list = prompts;
    for (; i < list.length; i += 1) {
      const prompt = list[i];

      const { name } = prompt;

      if (Object.hasOwnProperty.call(mockPrompts, prompt.name)) {
        answers[name] = mockPrompts[prompt.name];
      } else if (typeof prompt.default === 'function') {
        const res = prompt.default(answers);
        // eslint-disable-next-line no-await-in-loop
        answers[name] = res.then ? yield res : res;
      } else {
        answers[name] = prompt.default;
      }

      if (prompt.type === 'confirm' && typeof answers[name] === 'undefined') {
        answers[name] = true;
      }

      // Filter
      if (typeof prompt.filter === 'function') {
        const res = prompt.filter(answers[name], answers);
        // eslint-disable-next-line no-await-in-loop
        answers[name] = res.then ? yield res : res;
      }
      // Validation
      if (typeof prompt.validate === 'function') {
        let res = prompt.validate(answers[name], answers);
        // eslint-disable-next-line no-await-in-loop
        res = res.then ? yield res : res;
        if (typeof res === 'string') {
          // eslint-disable-next-line unicorn/prefer-type-error
          throw new Error(`Validation failed at prompt "${name}":\n${res}`);
        } else if (!res) {
          throw new Error(`Validation failed at prompt "${name}"`);
        }
      }
    }

    return answers;
  }());
}

function ask(prompts, mockPrompts) {
  return ctx => {
    if (mockPrompts && prompts) {
      return getMockedAnswers(mockPrompts, prompts).then(answers => {
        ctx.meta = { answers };
      });
    }

    if (prompts) {
      return inquirer.prompt(prompts).then(answers => {
        let i = 0, list = prompts;
        for (; i < list.length; i += 1) {
          const prompt = list[i];

          if (!Object.prototype.hasOwnProperty.call(answers, prompt.name)) {
            answers[prompt.name] = undefined;
          }
        }

        ctx.meta = { answers };
      });
    }
  };
}

let useTemplate = ({
                     skipInterpolation,
                     template = require('jstransformer-ejs'),
                     templateOptions = {}
                   } = {}) => {
  return ctx => {
    templateOptions =
      typeof templateOptions === 'function' ?
        templateOptions(ctx.meta) :
        templateOptions;

    const fileList = ctx.fileList;
    let matchedFile;
    if (skipInterpolation) {
      if (typeof skipInterpolation === 'function') {
        matchedFile = skipInterpolation;
      } else {
        const matches = match$1(fileList, skipInterpolation);
        matchedFile = file => matches.indexOf(file) !== -1;
      }
    }

    return Promise.all(fileList.map(relative => run(relative)));

    function run(file) {
      const content = ctx.fileContents(file);

      const shouldSkip = matchedFile && matchedFile(file, content);

      if (shouldSkip || isBinaryPath(file)) {
        return;
      }

      const res = require('jstransformer')(template).render(
        content,
        templateOptions,
        ctx.meta.merged
      );
      ctx.writeContents(file, res.body);
    }
  };
};

const skip = function (skipExisting, destPath) {
  return ctx => {
    return Promise.all(
      ctx.fileList.map(name => {
        const location = path.join(destPath, name);
        return exists(location).then(yes => {
          if (yes) {
            ctx.deleteFile(name);
            if (typeof skipExisting === 'function') {
              skipExisting(location, name);
            }
          }
        });
      })
    );
  };
};

const moveFiles = function (move) {
  return ctx => {
    if (typeof move === 'function') {
      move = move(ctx.meta.merged);
    }

    if (!move) {
      return;
    }

    for (const pattern in move) {
      const matches = match.match(ctx.fileList, pattern);
      if (matches.length > 0) {
        const newName = move[pattern];
        if (typeof newName === 'function') {
          for (var i = 0, list = matches; i < list.length; i += 1) {
            const match$$1 = list[i];

            const file = ctx.file(match$$1);
            const fileName = newName(match$$1);
            // eslint-disable-next-line max-depth
            if (fileName) {
              ctx.deleteFile(match$$1);
              ctx.createFile(fileName, file);
            }
          }
        } else if (typeof newName === 'string') {
          const file = ctx.file(matches[0]);
          ctx.deleteFile(matches[0]);
          ctx.createFile(newName, file);
        }
      }
    }
  };
};

function kopy(
  src,
  dest, {
    glob = ['**', '!**/node_modules/**'],
    cwd = process.cwd(),
    clean = false,
    // ask options
    data,
    prompts,
    mockPrompts,
    // template options
    disableInterpolation = false,
    skipInterpolation,
    template,
    templateOptions,
    // filter options
    filters,
    // skip existing file
    skipExisting,
    move,
    write = true
  } = {}
) {
  const destPath = path.resolve(cwd, dest);
  const base = path.resolve(cwd, src);

  const stream = majo();

  stream.source(glob, { baseDir: base }).filter(file => {
    return !/\.DS_Store$/.test(file);
  }).use(ask(prompts, mockPrompts)).use(ctx => {
    data =
      typeof data === 'function' ? data(ctx.meta && ctx.meta.answers) : data;
    ctx.meta = Object.assign({}, ctx.meta, {
      data,
      merged: Object.assign({}, data, ctx.meta.answers)
    });
  }).use(filterFiles(filters)).use(moveFiles(move));

  if (!disableInterpolation) {
    stream.use(
      useTemplate({
        skipInterpolation,
        template,
        templateOptions
      })
    );
  }

  if (skipExisting) {
    stream.use(skip(skipExisting, destPath));
  }

  if (write === false) {
    return stream.process().then(() => stream);
  }

  return stream.dest(destPath, { clean }).then(() => stream);
}

function getConfig(templateDir, configFileName) {
  const configPath = path.join(templateDir, '../' +
    configFileName);
  if (fs.existsSync(configPath)) {
    return require(configPath);
  } else {
    return null;
  }

}

const init = (template, dest, options, chalk, fn = () => {
}, error = () => {
}) => {
  kopy(template, dest, options).then(({ files, meta }) => {
    let { data, answers, merged } = meta;
    console.log();
    console.log('================================');

    for (const file in files) {
      if (files.hasOwnProperty(file)) {
        console.log(`${chalk.green('Generating')} · ${file}`);
        for (const _file of ['gitignore', 'editorconfig']) {
          if (_file === file) {
            console.log(`${chalk.magenta('Moving    ')} · ${file} -> .${file}`);
            $.mv(path.join(dest, file), path.join(dest, `.${file}`));
          }
        }
      }
    }
    console.log('\n> Installing... \n');
    fn(merged, template, dest, chalk);
    if (typeof options.after === 'function') {
      options.after(merged, template, dest, chalk);
    }
    console.log(`\n${chalk.bgGreen.black(' DONE ')} Successfully generated into ${chalk.yellow(tildify(dest))}!\n`);
    // console.log(data, answers, merged)

  }).catch(e => {
    error(e);
  });
};

module.exports = kopy;

module.exports.init = init;
module.exports.getConfig = getConfig;
