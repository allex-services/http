function createClientSide(execlib, ParentServicePack) {
  return {
    SinkMap: require('./sinkmapcreator')(execlib,ParentServicePack)
  };
}

module.exports = createClientSide;
