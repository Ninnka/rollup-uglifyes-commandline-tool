const outModule = require('./mod.js');

const someValue = 'a';
console.log(someValue);
const func = () => {
  const list = outModule.list.map((item) => {
    return item + 1;
  });
  let funcInnerValue = 'funcInnerValue';
  const sfeqw = funcInnerValue;
  return {
    sfeqw,
    list
  };
}

module.exports = {
  someValue,
  func
}