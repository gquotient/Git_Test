var request = require('request'),
    _ = require('lodash');

module.exports = function(app){

  var helpers = require('./helpers')(app),
    ensureAuthorized = helpers.ensureAuthorized,
    ensureCurrentOrganization = helpers.ensureCurrentOrganization,
    makeRequest = helpers.makeRequest;

  // Get active project alarms
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

  // Create a new alarm from a template
  app.post('/api/alarms', ensureCurrentOrganization,
    function(req, res){
      request({
        method: 'POST',
        uri: app.get('dataUrl') + '/alarms/',
        headers: {
          'accept-encoding' : 'gzip,deflate'
        }
      }).pipe(res);
    }
  );

  // Get alarm templates available for a given project
  app.get('/api/project_alarms/:projectId?', ensureAuthorized(['vendor_admin', 'admin']), ensureCurrentOrganization,
    function(req, res, next){
      req.query = _.extend({}, req.query, {project_label: req.params.projectId});
      next();
    },
    helpers.request({
      path: '/res/project_alarms'
    })
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
