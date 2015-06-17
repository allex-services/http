function createHttpServiceTester(execlib, Tester) {
  'use strict';
  var lib = execlib.lib;

  function HttpServiceTester(prophash, client) {
    Tester.call(this, prophash, client);
    console.log('runNext finish');
    lib.runNext(this.finish.bind(this, 0));
  }
  lib.inherit(HttpServiceTester, Tester);

  return HttpServiceTester;
}

module.exports = createHttpServiceTester;
