var _ = require('lodash')
, fs = require('fs');

module.exports = function(app){

  var helpers = require('./helpers')(app)
  , ensureAuthorized = helpers.ensureAuthorized
  , path = './data/json/specs';

  //////
  // SPECS
  //////

  app.get('/api/specs',
    function(req, res){
      var specs = [];

      fs.readdir(path, function(err, files){
        if (!err) {
          files.forEach(function(file){
            if (file.substr(-5) === '.json') {
              specs.push(fs.readFileSync(path + '/' + file));
            }
          });
        }

        res.end('[' + specs.join(',') + ']');
      });
    });

  app.post('/api/specs', ensureAuthorized(['vendor_admin', 'admin']),
    function(req, res){
      var body = req.body || {},
        name = body.name;

      if (name) {
        fs.mkdir(path, function(err){
          var file = name.toLowerCase().replace(' ', '_') + '.json';

          fs.writeFileSync(path + '/' + file, JSON.stringify(body));
        });
      }

      res.end();
    });

};
