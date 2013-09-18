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

  app.get('/api/alarms/:projectId?',
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

  app.put('/api/alarms/:projectId?/:alarmId?',
    function(req, res){
      request({
        method: 'GET',
        uri: app.get('dataUrl') + '/alarms/ack/' + req.params.projectId + '/' + req.params.alarmId,
        headers: {
          'accept-encoding' : 'gzip,deflate'
        }
      }).pipe(res);
    }
  );

  app.del('/api/alarms/:projectId?/:alarmId?',
    function(req, res){
      console.log('delete', req.params.alarmId);
      request({
        method: 'POST',
        uri: app.get('dataUrl') + '/alarms/delete/' + req.params.projectId + '/' + req.params.alarmId,
        headers: {
          'accept-encoding' : 'gzip,deflate'
        }
      }).pipe(res);
    }
  );
};
