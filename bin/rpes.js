#!/d/nodejs/node

const path = require('path');
const rollup = require('rollup');
const globby = require('globby');
const uglifyEs = require('uglify-es');
const uglify = require('rollup-plugin-uglify');
const program = require('commander');
const colors = require('colors');

const platform = process.platform;

let originSrcPath = path.resolve(__dirname, 'src/**/*.js');
let replacePart = '';

const outputPathPrefix = path.resolve(process.cwd(), 'dist').replace(/\\/g, '\/');
// console.log('outputPathPrefix', outputPathPrefix);

const commonSetting = {
  plugins: [
    uglify({
      mangle: {
        toplevel: true
      }
    }, uglifyEs.minify)
  ],
  treeshake: false
};

program
  .version('ruct v0.0.1', '-v, --version')
  // .option('-T, --type [type]', 'test options type [option-args]', 'option-args')
  .option('-i, --input [path]', 'Set file Or directory [path] to be resolved', originSrcPath)
  .option('-o, --output', 'Set position where resolved file in')
  .parse(process.argv);

// * 入口
if (program.input) {
  originSrcPath = program.input;
}
console.log('entry: '.yellow, originSrcPath.yellow);

if (platform.indexOf('win') !== -1) {
  console.log('system：window'.cyan);
  const srcUnixTypePath = originSrcPath.replace(/\\\\/g, '\/').replace(/\\/g, '\/');
  const wcIndex = srcUnixTypePath.indexOf('*');
  replacePart = srcUnixTypePath.substring(0, wcIndex);
  if (replacePart[replacePart.length - 1] === '/') {
    replacePart = replacePart.substring(0, replacePart.length - 1);
  }
} else {
  console.log('system：linux Or OSX'.cyan);
  const srcUnixTypePath = originSrcPath;
  const wcIndex = srcUnixTypePath.indexOf('*');
  replacePart = srcUnixTypePath.substring(0, wcIndex);
  if (replacePart[replacePart.length - 1] === '/') {
    replacePart = replacePart.substring(0, replacePart.length - 1);
  }
}

// * 出口
if (program.output) console.log('output');

const configs = globby.sync(originSrcPath).map((inputFile) => {
  console.log('inputFile: '.blue, inputFile.blue);
  return {
    inputOptions: Object.assign({}, {
      input: inputFile,
    }, commonSetting),
    outputOptions: {
      file: setOutputFileFilterByPlatform(inputFile),
      format: 'cjs'
    }
  }
});

function setOutputFileFilterByPlatform (inputFile) {
  return inputFile.replace(replacePart, outputPathPrefix);
}

async function build(config) {
  const bundle = await rollup.rollup(config.inputOptions);

  // console.log(bundle.imports); // an array of external dependencies
  // console.log(bundle.exports); // an array of names exported by the entry point
  // console.log(bundle.modules); // an array of module objects

  // generate code and a sourcemap
  // const { code, map } = await bundle.generate();

  // write the bundle to disk
  await bundle.write(config.outputOptions);
}

const builds = configs.map((config, index, list) => {
  return new Promise(async (resolve, reject) => {
    try {
      await build(config);
      console.log('outputFile: '.green, config.outputOptions.file.green);
      resolve();
    } catch (err) {
      reject(err);
    }
  }).catch((err) => {
    console.log('build err: '.red, err.red);
  });
});
