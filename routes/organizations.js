module.exports = function(app){

  var helpers = require('./helpers')(app)
    , ensureAuthorized = helpers.ensureAuthorized
    , ensureCurrentOrganization = helpers.ensureCurrentOrganization
    , makeRequest = helpers.makeRequest;



  ////////
  // ORGANIZATIONS
  ///////

  app.get('/api/organizations', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/organizations'
    }));

  app.get('/api/organizations/:org_label/users', ensureAuthorized(['vendor_admin', 'admin']), ensureCurrentOrganization,
    makeRequest({
      path: '/res/users'
    }));

};
