var _ = require('lodash')
  , request = require('request');

module.exports = function(app){
  
  var helpers = require('./helpers')(app)
  , makeRequest = helpers.makeRequest
  , ensureAuthorized = helpers.ensureAuthorized
  , separateProperties = helpers.separateProperties;

  //////
  // PROJECTS
  //////

  app.get('/api/projects',
    function(req, res){
      request({
        method: 'GET',
        uri: app.get('modelUrl') + '/res/projects',
        headers: {
          currentUser: req.user.email,
          access_token: req.user.access_token,
          clientSecret: app.get('clientSecret')
        },
        qs: req.query || {}
      },
      function(err, resp, body){
        var project = {};

        if (err) {
          req.flash('error', err.message);
          console.log('error!:', err);
          res.redirect('/ia');

        } else if (resp.statusCode === 200) {
          body = JSON.parse(body);

          project = _.extend({},
            body.properties,
            _.omit(body, 'properties', 'children')
          );

          request({
            method: 'GET',
            uri: [
              app.get('modelUrl'),
              'api/project/devices',
              project.project_label,
              'AlignedProjects'
            ].join('/'),
            headers: {
              currentUser: req.user.email,
              access_token: req.user.access_token,
              clientSecret: app.get('clientSecret')
            }
          },
          function(err, resp, body){
            if (err) {
              req.flash('error', err.message);
              console.log('error!:', err);
              res.redirect('/ia');

            } else if (resp.statusCode === 200) {
              body = JSON.parse(body);

              project.devices = body.devices || [];
              project.rels = body.rels || [];
            }

            res.send(project);
          });
        }
      });
    });

  app.post('/api/projects',
    makeRequest({
      path: '/res/projects',
      setup: function(req, res, next){
        req.body = _.pick(req.body, [
          'name',
          'site_label',
          'latitude',
          'longitude',
          'elevation',
          'index_name'
        ]);

        next(req, res);
      },
      translate: function(body, next){
        next(_.extend({},
          body.properties,
          _.omit(body, 'properties')
        ));
      }
    }));
  
  app.put('/api/projects',
    makeRequest({
      path: '/res/projects',
      setup: separateProperties([
        'id',
        'project_label'
      ], [
        'site_label',
        'latitude',
        'longitude',
        'elevation',
        'index_name'
      ]),
      translate: function(body, next){
        next(_.extend({},
          body.properties,
          _.omit(body, 'properties')
        ));
      }
    }));
};
