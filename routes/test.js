var express = require('express');
var router = express.Router();


createRouter = (str) => {
  router.get('/', (req, res) => {
    console.log(str);
    res.send(str);
  })

  return router;
}

module.exports = createRouter;