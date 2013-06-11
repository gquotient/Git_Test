var _ = require('lodash');

module.exports = function(app){

  var helpers = require('./helpers')(app),
  makeRequest = helpers.makeRequest,
  separateProperties = helpers.separateProperties;

  //////
  // DEVICES
  //////

  app.post('/api/devices',
    makeRequest({
      path: '/res/devices',
      setup: separateProperties([
        'project_label',
        'parent_id',
        'relationship_label'
      ], [
        'id'
      ]),
      translate: function(body, next){
        next(_.extend({},
          body.properties,
          _.omit(body, 'properties')
        ));
      }
    }));

  app.put('/api/devices',
    makeRequest({
      path: '/res/devices',
      setup: separateProperties([
        'id',
        'project_label'
      ], [
        'parent_id',
        'relationship_label'
      ]),
      translate: function(body, next){
        next(_.extend({},
          body.properties,
          _.omit(body, 'properties')
        ));
      }
    }));

};
