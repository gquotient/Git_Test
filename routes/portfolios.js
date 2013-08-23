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
    // Ok, so, delete needs to happen in 2 places for a portfolio to actually be deleted
    // this is definitely not right so, we are going to have a conversation about
    // reshaping sensible Portfolio sharing and how that impacts the API
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

    // Delete it from the team first
    request(options, function(error, response, body){
      defer.resolve();
    });

    // Then from the user's private portfolios
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

    //TADA! Your portfolio is deleted...
  });
};
