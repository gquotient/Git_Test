module.exports = function(app){

  var helpers = require('./helpers')(app)
    , ensureAuthorized = helpers.ensureAuthorized
    , ensureCurrentUser = helpers.ensureCurrentUser
    , ensureCurrentOrganization = helpers.ensureCurrentOrganization
    , makeRequest = helpers.makeRequest;

  //////
  // USERS
  //////

  // Get all users
  app.get('/api/users', ensureAuthorized(['vendor_admin', 'admin']), ensureCurrentOrganization,
    makeRequest({
      path: '/res/users'
    }));

  app.get('/api/users/current', makeRequest({
    path: '/res/user'
  }));

  app.put('/api/users', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/user'
    }));

  app.put('/api/users/current', ensureCurrentUser, ensureCurrentOrganization,
    makeRequest({
      path: '/res/user'
    }));

  app.post('/api/users', ensureAuthorized(['vendor_admin', 'admin']), ensureCurrentOrganization,
    makeRequest({
      path: '/res/usermgt'
    }));

  app.del('/api/users', ensureAuthorized(['vendor_admin', 'admin']), ensureCurrentOrganization,
    makeRequest({
      path: '/res/usermgt'
    }));

  app.put('/api/reset_password', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/usermgt'
    }));

};
