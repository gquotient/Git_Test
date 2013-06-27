var _ = require('lodash')
, fs = require('fs')
, request = require('request');

module.exports = function(app){

  var helpers = require('./helpers')(app)
  , ensureAuthorized = helpers.ensureAuthorized;

  //////
  // EQUIPMENT
  //////

  app.get('/api/equipment',
    function(req, res){
      fs.readFile('./data/json/equipment.json', 'utf8', function (err, data) {
        if (err) {
          return console.log(err);
        }
        res.end(data);
      });
    });

};
