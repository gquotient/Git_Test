module.exports = function(app){

  var helpers = require('./helpers')(app)
  , makeRequest = helpers.makeRequest
  , ensureAuthorized = helpers.ensureAuthorized
  , ensureCurrentOrganization = helpers.ensureCurrentOrganization;


  //////
  // TEAMS
  //////

  app.get('/api/teams', ensureAuthorized(['vendor_admin', 'admin']), ensureCurrentOrganization,
    makeRequest({
      path: '/res/teams',
      translate: function(data, next){
        next(data.teams);
      }
    }));

  app.get('/api/teams/:team_id/users', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/userteammgt',
      setup: function(req, res, next){
        var teamId = req.params.team_id.split('_');
        req.query.org_label = teamId[0];
        req.query.team_label = teamId[1];
        if(req.user.org_label === teamId[0] || req.user.role === 'vendor_admin'){
          next(req, res);
        } else {
          console.log('You\'re not allowed to look at that team.');
        }
      }
    }));

  app.post('/api/teams', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/teams'
    }));

  app.put('/api/teams', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/teams'
    }));

  app.put('/api/user_team', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/userteammgt'
    }));

  app.del('/api/user_team', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/userteammgt'
    }));
}
