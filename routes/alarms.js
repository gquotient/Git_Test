var request = require('request');

module.exports = function(app){

  var helpers = require('./helpers')(app)
    , ensureAuthorized = helpers.ensureAuthorized
    , ensureCurrentOrganization = helpers.ensureCurrentOrganization
    , makeRequest = helpers.makeRequest;
    

  app.get('/api/alarms', ensureAuthorized(['vendor_admin', 'admin']), ensureCurrentOrganization,
    makeRequest({
      path: '/res/alarms'
    })
  );

  app.get('/api/alarms/active/:projectId?',
    function(req, res){
      request({
        method: 'GET',
        uri: app.get('dataUrl') + '/alarms/active/' + req.params.projectId,
        headers: {
          'accept-encoding' : 'gzip,deflate'
        }
      }).pipe(res);
    }
  );
};
