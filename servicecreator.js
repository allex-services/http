function createHttpService(execlib,ParentService){
  'use strict';
  var lib = execlib.lib,
    qlib = lib.qlib;

  function factoryCreator(parentFactory){
    return {
      'service': require('./users/serviceusercreator')(execlib,parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib,parentFactory.get('user')) 
    };
  }

  function ServerMaintainer (onerror, onrequest) {
    lib.ChangeableListenable.call(this);
    lib.Destroyable.call(this);

    this._server = null;
    this._onecb = onerror;
    this._onreq = onrequest;
    this.status = 'down';

    this.protocol = null;
    this.port = null;
  }

  lib.inherit(ServerMaintainer, lib.ChangeableListenable);
  ServerMaintainer.prototype.__cleanUp = function () {
    this.stop().done (this._fullCleanup.bind(this));
  };

  ServerMaintainer.prototype._fullCleanup = function () {
    this._server = null;
    this._onecb = null;
    this._onreq = null;
    this.status = null;
    lib.ChangeableListenable.prototype.__cleanUp.call(this);
    lib.Destroyable.prototype.__cleanUp.call(this);
  };

  ServerMaintainer.prototype.set_port = function (val) {
    if (this.status !== 'down') {
      console.log('Port change not allowed while server not down ...');
      return;
    }
    this.port = val || null;
  };

  ServerMaintainer.prototype.set_protocol = function (val) {
    if (this.status !== 'down') {
      console.log('Protocol change not allowed while server not down ...');
      return;
    }
    this.protocol = val;
  };
  
  ServerMaintainer.prototype._startFailed = function (e) {
    /// just a helper ....
    console.log('Error: Start failed due to ', e);
  };

  ServerMaintainer.prototype.start = function (defer) {
    if (!defer) defer = lib.q.defer();
    var port = this.port, protocol = this.protocol;
    defer.promise.done(lib.dummyFunc, this._startFailed.bind(this));

    if (this.status !== 'down') {
      defer.reject('Server is not down in order to be started, try again later');
    }else if (!port) {
      defer.reject('Missing port');
    }else if (!protocol) {
      defer.reject('Missing protocol');
    }else{
      if (this._server) {
        ///this should never happen but if does, kill'em all and start all over again ...
        this._onServerClosed();
      }
      this._server = require(protocol).createServer(this._onreq);
      this._server.timeout = 2*lib.intervals.Hour;
      this._server.on('error', this._onecb);
      this._server.on('close', this._onServerClosed.bind(this));
      this._server.on('listening', this._onServerListenOn.bind(this));
      this.set('status', 'starting');
      this._server.listen(port, defer.resolve.bind(defer));
    }
    return defer.promise;
  };

  ServerMaintainer.prototype.stop = function (defer) {
    if (!defer) defer = lib.q.defer();
    if (this._server) {
      this.set('status', 'stopping');
      this._server.close(defer.resolve.bind(defer));
    }else{
      this.set('status', 'down');
      defer.resolve();
    }
    return defer.promise;
  };

  ServerMaintainer.prototype._reconfigure_and_start = function (reconfiguration, defer) {
    if (lib.defined(reconfiguration.port)) this.set('port', reconfiguration.port);
    if (lib.defined(reconfiguration.protocol)) this.set('protocol', reconfiguration.protocol);
    this.start().done(defer.resolve.bind(defer));
  };

  ServerMaintainer.prototype.restart = function (reconfiguration, defer) {
    if (!defer) defer = lib.q.defer();
    this.stop().done(this._reconfigure_and_start.bind(this, reconfiguration, defer));
    return defer.promise;
  };


  ServerMaintainer.prototype._onServerListenOn = function (config) {
    this.set('status', 'running');
  };

  ServerMaintainer.prototype._onServerClosed = function () {
    ///clean up this._server var ...
    var s = this._server;
    s.removeAllListeners();
    s.unref();
    this._server = null;
    this.set('status', 'down');
  };

  function HttpService(prophash){
    ParentService.call(this,prophash);
    this.sm = new ServerMaintainer(this._onServerError.bind(this), this._onRequestBase.bind(this));

    this._sm_status_listener = this.sm.attachListener('status', this.state.set.bind(this.state, 'status'));
    this._sm_port_listener = this.sm.attachListener('port', this.state.set.bind(this.state, 'port'));
    this._sm_proto_listener= this.sm.attachListener('protocol', this.state.set.bind(this.state, 'protocol'));

    this.sm.set('protocol', 'http');
    if (prophash.port) {
      this._onPortAcquired(prophash.port);
    } else {
      var d = lib.q.defer();
      this.acquirePort(d);
      d.promise.done(this._onPortAcquired.bind(this));
    }
  }
  ParentService.inherit(HttpService,factoryCreator);
  HttpService.prototype.__cleanUp = function(){
    this._sm_proto_listener.destroy();
    this._sm_status_listener = null;
    this._sm_port_listener.destroy();
    this._sm_port_listener = null;
    this._sm_status_listener.destroy();
    this._sm_status_listener = null;

    this.sm.destroy();
    this.sm = null;
    ParentService.prototype.__cleanUp.call(this);
  };

  HttpService.prototype.acquirePort = function (defer) {
    ///OVERRIDE PLEASE
    defer.reject('Not implemented acquirePort');
  };

  HttpService.prototype._onPortAcquired = function (port) {
    this.sm.set('port', port);
    if (this.readyToAcceptUsersDefer) {
      this.readyToAcceptUsersDefer.promise.then(
        qlib.executor(this.sm.start.bind(this.sm))
      );
    } else {
      this.sm.start();
    }
  };

  HttpService.prototype._onRequestBase = function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    this._onRequest(req, res);
  };

  HttpService.prototype._onRequest = function (req, res) {
    throw new Error('_onRequest not implemented');
  };

  HttpService.prototype.start = function (defer) {
    this.sm.start(defer);
  };
  HttpService.prototype.stop = function (defer) {
    this.sm.stop(defer);
  };

  HttpService.prototype.restart = function(reconfiguration , defer){
    this.sm.restart(reconfiguration, defer);
  };

  HttpService.prototype._onServerError = function(reason){
    throw reason;
  };

  return HttpService;
}

module.exports = createHttpService;
