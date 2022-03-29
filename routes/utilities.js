module.exports.handleReturnObj = (res, emitter, returnObj) => {
  for (let id of Object.keys(returnObj.ntfObj)) {
    emitter.emit(id, returnObj.ntfObj[id]);
  }
  emitter.emit("TEST");
  res.send(returnObj.response);
}
