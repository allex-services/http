function createHttpService(execlib,ParentServicePack){
  'use strict';
  var ParentService = ParentServicePack.Service;

  function factoryCreator(parentFactory){
    return {
      'service': require('./users/serviceusercreator')(execlib,parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib,parentFactory.get('user')) 
    };
  }

  function HttpService(prophash){
    ParentService.call(this,prophash);
  }
  ParentService.inherit(HttpService,factoryCreator);
  HttpService.prototype.__cleanUp = function(){
    ParentService.prototype.__cleanUp.call(this);
  };
  
  return HttpService;
}

module.exports = createHttpService;
