module.exports = function(app){

  var helpers = require('./helpers')(app)
    , makeRequest = helpers.makeRequest
    , ensureCurrentOrganization = helpers.ensureCurrentOrganization
    , ensureCurrentTeam = helpers. ensureCurrentTeam;


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

  app.del('/api/portfolios', ensureCurrentOrganization, ensureCurrentTeam,
    makeRequest({
      path: '/res/teamportfolios'
    })
  );

};
