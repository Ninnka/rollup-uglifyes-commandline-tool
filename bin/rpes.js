#!/bin/env node

const path = require('path');
const rollup = require('rollup');
const globby = require('globby');
const uglifyEs = require('uglify-es');
const uglify = require('rollup-plugin-uglify');
const program = require('commander');
const colors = require('colors');

const platform = process.platform;

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

// * 默认入口
let originSrcPath = path.resolve(process.cwd(), 'src/**/*.js');

// * 默认出口
let outputPathPrefix = path.resolve(process.cwd(), 'dist').replace(/\\/g, '\/');

// * 获取的出口
let outputSpecified = '';

program
  .version('ruct v0.0.1', '-v, --version')
  .option('-i, --input [path]', 'Set file Or directory [path] to be resolved', originSrcPath)
  .option('-o, --output [outpath]', 'Set position [outpath] where resolved file in', outputPathPrefix)
  .parse(process.argv);

// * 入口
if (program.input) {
  // originSrcPath = program.input.replace(/\\/g, '\/');
  originSrcPath = path.resolve(process.cwd(), program.input).replace(/\\/g, '\/');
}
console.log('entry: '.yellow, originSrcPath.yellow);

if (platform.indexOf('win') !== -1) {
  console.log('system: '.cyan, 'window'.cyan);
} else {
  console.log('system: '.cyan, 'linux Or OSX'.cyan);
}

const wcIndex = originSrcPath.indexOf('*');
// * 生成出口时需要替换的部分
let replacePart = wcIndex !== -1 ? originSrcPath.substring(0, wcIndex) : originSrcPath;
if (replacePart[replacePart.length - 1] === '/') {
  replacePart = replacePart.substring(0, replacePart.length - 1);
}

// * 出口
if (program.output) {
  // outputSpecified = program.output.replace(/\\/g, '\/');
  outputSpecified = path.resolve(process.cwd(), program.output).replace(/\\/g, '\/');
}

const configs = globby.sync(originSrcPath).map((inputFile) => {
  console.log('inputFile: '.blue, inputFile.blue);
  return {
    inputOptions: Object.assign({}, {
      input: inputFile,
    }, commonSetting),
    outputOptions: {
      file: outputSpecified ? setOutputFileBySpecified(inputFile) : setOutputFileFilterByPlatform(inputFile),
      format: 'cjs'
    }
  }
});

function setOutputFileFilterByPlatform (inputFile) {
  return inputFile.replace(replacePart, outputPathPrefix);
}

function setOutputFileBySpecified (inputFile) {
  return inputFile.replace(replacePart, outputSpecified);
}

async function build(config) {
  const bundle = await rollup.rollup(config.inputOptions);

  // console.log(bundle.imports); // *  an array of external dependencies
  // console.log(bundle.exports); // *  an array of names exported by the entry point
  // console.log(bundle.modules); // * an array of module objects

  // * generate code and a sourcemap
  // const { code, map } = await bundle.generate();

  // * write the bundle to disk
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
