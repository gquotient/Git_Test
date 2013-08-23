module.exports = function(app){

  var request = require('request')
    , _ = require('lodash')
    , Q = require('q')
    , helpers = require('./helpers')(app)
    , makeRequest = helpers.makeRequest
    , ensureCurrentOrganization = helpers.ensureCurrentOrganization
    , ensureCurrentTeam = helpers.ensureCurrentTeam;


  app.get('/api/portfolios', ensureCurrentOrganization, ensureCurrentTeam,
    makeRequest({
      path: '/res/teamportfolios'
    })
  );

  app.post('/api/portfolios', ensureCurrentOrganization, ensureCurrentTeam,
    makeRequest({
      path: '/res/portfolio'
    })
  );

  app.put('/api/portfolios', ensureCurrentOrganization, ensureCurrentTeam,
    makeRequest({
      path: '/res/portfolio'
    })
  );

  app.del('/api/portfolios', ensureCurrentOrganization, ensureCurrentTeam, function(req, res){
    var defer = Q.defer();

    var options = {
      method: req.method,
      host: app.get('modelUrl'),
      path: '/res/teamportfolios',
      uri: app.get('modelUrl') + '/res/teamportfolios',
      headers: {
        currentUser: req.user.email,
        access_token: req.user.access_token,
        clientSecret: app.get('clientSecret')
      },
      qs: req.body
    };

    request(options, function(error, response, body){
      defer.resolve();
    });

    defer.promise.then(function(){
      request(
        _.extend({}, options, {
          path: '/res/portfolio',
          uri: app.get('modelUrl') + '/res/portfolio'
        }),
        function(error, response, body){
          res.end(body);
        }
      );
    });
  });
};
