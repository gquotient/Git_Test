var _ = require('lodash')
, request = require('request');

module.exports = function(app){

  var helpers = require('./helpers')(app)
  , ensureAuthorized = helpers.ensureAuthorized
  , parseEquipment = helpers.parseEquipment;

  //////
  // EQUIPMENT
  //////

  app.get('/api/equipment',
    helpers.request({
      host: app.get('equipUrl'),
      path: '/api/equipment',
      middleware: true
    }),
    function(req, res){
      res.send(res.statusCode, parseEquipment(res.body));
    });

};
