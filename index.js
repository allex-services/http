function createServicePack(execlib) {
  'use strict';
  var execSuite = execlib.execSuite,
    ParentServicePack = execSuite.registry.get('.');

  var ret = require('./clientside')(execlib, ParentServicePack);
  ret.Service = require('./servicecreator')(execlib,ParentServicePack);
  return ret;
}

module.exports = createServicePack;
