var request = require('request');

module.exports = function(app){

  var helpers = require('./helpers')(app)
    , ensureAuthorized = helpers.ensureAuthorized
    , ensureCurrentOrganization = helpers.ensureCurrentOrganization
    , makeRequest = helpers.makeRequest;


  app.get('/api/alarms', ensureCurrentOrganization,
    makeRequest({
      path: '/res/alarms'
    })
  );

  // Get project alarms
  app.get('/api/alarms/:projectId?', ensureCurrentOrganization,
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

  // Acknowledge
  app.put('/api/alarms/:projectId?/:alarmId?', ensureCurrentOrganization,
    function(req, res){
      request({
        method: 'POST',
        uri: app.get('dataUrl') + '/alarms/ack/' + req.params.projectId + '/' + req.params.alarmId,
        form: req.body,
        headers: {
          'accept-encoding' : 'gzip,deflate'
        }
      }).pipe(res);
    }
  );

  // Resolve
  app.put('/api/alarms/resolve/:projectId?/:alarmId?', ensureCurrentOrganization,
    function(req, res){
      request({
        method: 'POST',
        uri: app.get('dataUrl') + '/alarms/resolve/' + req.params.projectId + '/' + req.params.alarmId,
        headers: {
          'accept-encoding' : 'gzip,deflate'
        }
      }).pipe(res);
    }
  );

  // Delete
  app.del('/api/alarms/:projectId?/:alarmId?', ensureCurrentOrganization,
    function(req, res){
      request({
        method: 'DEL',
        uri: app.get('dataUrl') + '/alarms/' + req.params.projectId + '/' + req.params.alarmId,
        headers: {
          'accept-encoding' : 'gzip,deflate'
        }
      }).pipe(res);
    }
  );
};
