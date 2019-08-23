var _allowedprotocols = ['http', 'https'];
var _allowedmethods = ['GET', 'POST'];

function onData (defer, buffer) {
  var str = buffer.toString();
  try {
    str = JSON.parse(str);
  }
  catch (e) {
    //console.error(e);
  }
  defer.resolve(str);
  defer = null;
}

function Requester (protocol, address, port, method, options) {
  if (_allowedprotocols.indexOf(protocol)<0) {
    console.error('The given protocol', protocol, 'is not one of', _allowedprotocols);
    process.exit(1);
  }
  if (_allowedmethods.indexOf(method)<0) {
    console.error('The given method', method, 'is not one of', _allowedmethods);
    process.exit(1);
  }
  this.protocol = protocol;
  this.address = address;
  this.port = port;
  this.method = method;
  this.options = options || {};
  this.lastReply = null;
}
Requester.prototype.destroy = function () {
  this.lastReply = null;
  this.options = null;
  this.method = null;
  this.port = null;
  this.address = null;
  this.protocol = null;
};
Requester.prototype.request = function (command, parameters) {
  var d = q.defer(), ret = d.promise, url;
  url = this.protocol+'://'+this.address+':'+this.port+'/'+command;
  if (this.shouldLog()) {
    console.log('url', url, '=>', parameters);
  }
  lib.request(url, {
    method: this.method,
    parameters: parameters,
    onData: onData.bind(null, d),
    onError: d.reject.bind(d)
  });
  ret = ret.then(this.setLastReply.bind(this, command));
  return this.shouldLog() ?
		qlib.promise2console(ret, 'request for '+command)
    :
    ret;
};
Requester.prototype.shouldLog = function () {
  return this.options ? this.options.debug : false;
};
Requester.prototype.setLastReply = function (command, reply) {
  this.lastReply = reply;
  return q(reply);
};

setGlobal('HTTPRequester', Requester);
