module.exports = function(app){

  var helpers = require('./helpers')(app)
    , makeRequest = helpers.makeRequest;

  //////
  // USERS
  //////

  // Get all users
  app.get('/api/users', helpers.ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/users'
    }));

  app.get('/api/users/current', helpers.makeRequest({
    path: '/res/user'
  }));

  app.put('/api/users', helpers.ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/user'
    }));

  app.put('/api/users/current', helpers.ensureCurrentUser,
    makeRequest({
      path: '/res/user'
    }));

  app.post('/api/users', helpers.ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/usermgt'
    }));

  app.put('/api/reset_password', helpers.ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/usermgt'
    }));

};
