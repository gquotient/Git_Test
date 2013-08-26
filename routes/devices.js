var _ = require('lodash');

module.exports = function(app){

  var helpers = require('./helpers')(app)
  , ensureAuthorized = helpers.ensureAuthorized
  , makeRequest = helpers.makeRequest
  , separateProperties = helpers.separateProperties;

  //////
  // DEVICES
  //////

  app.post('/api/devices', ensureAuthorized(['vendor_admin']),
    makeRequest({
      path: '/res/devices',
      setup: separateProperties([
        'project_label',
        'parent_id',
        'relationship_label'
      ], [
        'id',
        'node_id'
      ]),
      translate: function(body, next){
        body = _.extend({},
          body.properties,
          _.omit(body, 'properties')
        );

        if (body.renderings) {
          body.renderings = JSON.parse(body.renderings);
        }

        next(body);
      }
    }));

  app.put('/api/devices', ensureAuthorized(['vendor_admin']),
    makeRequest({
      path: '/res/devices',
      setup: separateProperties([
        'node_id',
        'project_label'
      ], [
        'id',
        'parent_id',
        'relationship_label'
      ]),
      translate: function(body, next){
        body = _.extend({},
          body.properties,
          _.omit(body, 'properties')
        );

        if (body.renderings) {
          body.renderings = JSON.parse(body.renderings);
        }

        next(body);
      }
    }));

  app.del('/api/devices', ensureAuthorized(['vendor_admin']),
    makeRequest({
      path: '/res/devices'
    }));


  //////
  // DEVICE RELATIONSHIPS
  //////

  app.all('/api/relationships', ensureAuthorized(['vendor_admin']),
    makeRequest({
      path: '/res/relationships'
    }));

};
