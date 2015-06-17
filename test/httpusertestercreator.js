function createHttpUserTester(execlib, Tester) {
  'use strict';
  var lib = execlib.lib;

  function HttpUserTester(prophash, client) {
    Tester.call(this, prophash, client);
    console.log('runNext finish');
    lib.runNext(this.finish.bind(this, 0));
  }
  lib.inherit(HttpUserTester, Tester);

  return HttpUserTester;
}

module.exports = createHttpUserTester;
