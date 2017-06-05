var assert = require('assert');
var fs = require('fs');
var ejs = require('ejs');
var join = require('path').join;

var transform = require('../');

ejs.delimiter = '@';

var locals = {
  pets: [
    { name: "Tim"   },
    { name: "Ginny" },
    { name: "Deb"   },
    { name: "Neal"  }
  ]
};
var file = join(__dirname, 'input.ejs');
var input = fs.readFileSync(file, 'utf8');
var expected = fs.readFileSync(join(__dirname, 'expected.html'), 'utf8');
var options = { filename: file };
var output;
var failed = false;

function assertEqual(output, expected) {
  console.log('\tOutput:', JSON.stringify(output));
  console.log('\tExpected:', JSON.stringify(expected));
  if (output !== expected) {
    console.log('\tFAILED');
    failed = true;
  } else {
    console.log('\tPASSED');
  }
}

try {
  console.log('\ncompile():');
  output = transform.compile(input, options)(locals);
  assertEqual(output, expected);
} catch (e) {
  failed = true;
  console.error(e.stack);
}

try {
  console.log('\ncompileClient():')
  output = transform.compileClient(input, options);
  eval('output = ' + output);
  output = output(locals);
  assertEqual(output, expected);
} catch (e) {
  failed = true;
  console.error(e.stack);
}

try {
  console.log('\ncompileFile():');
  output = transform.compileFile(file)(locals);
  assertEqual(output, expected);
} catch (e) {
  failed = true;
  console.error(e.stack);
}

console.log('\nTests ' + (failed ? 'FAILED' : 'PASSED'));

if (failed) process.exit(1);
