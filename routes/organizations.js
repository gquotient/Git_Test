module.exports = function(app){

  var helpers = require('./helpers')(app)
    , ensureAuthorized = helpers.ensureAuthorized
    , makeRequest = helpers.makeRequest;



  ////////
  // ORGANIZATIONS
  ///////

  app.get('/api/organizations', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/organizations'
    }));

  app.get('/api/organizations/:org_label/users', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/users',
      setup: function(req, res, next){
        console.log(req.user.role);
        if(req.user.org_label === req.params.org_label || req.user.role === 'vendor_admin'){
          next(req, res);
        } else {
          console.log('You\'re not allowed to look at that organization.');
        }
      }
    }));

};
