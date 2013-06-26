var _ = require('lodash')
, request = require('request');

module.exports = function(app){

  var helpers = require('./helpers')(app)
  , ensureAuthorized = helpers.ensureAuthorized
  , makeRequest = helpers.makeRequest
  , separateProperties = helpers.separateProperties;

  //////
  // PROJECTS
  //////

  app.get('/api/projects',
    function(req, res){
      var project_label = req.query.project_label,
        project = {devices: [], rels: []};

      if (project_label) {
        request({
          method: 'GET',
          uri: [
            app.get('modelUrl'),
            'api/project/devices',
            project_label,
            req.query.index || 'StagedProjects'
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

            _.each(body.devices, function(node){
              if (/^PV[ASC]/.test(node.did)) {
                _.extend(project, _.omit(node, 'devices', 'rels'));

              } else if (!/^EQT/.test(node.did)) {
                node.project_label = project_label;

                if (node.renderings) {
                  node.renderings = JSON.parse(node.renderings);
                }

                project.devices.push(node);
              }
            });

            _.each(body.rels, function(rel){
              if (rel[1] !== 'SPEC') {
                project.rels.push(rel);
              }
            });
          }

          res.send(project);
        });
      }
    });

  app.post('/api/projects', ensureAuthorized(['vendor_admin', 'admin']),
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

  app.put('/api/projects', ensureAuthorized(['vendor_admin', 'admin']),
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
