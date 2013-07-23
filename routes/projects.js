var _ = require('lodash')
, request = require('request');

module.exports = function(app){

  var helpers = require('./helpers')(app)
  , ensureAuthorized = helpers.ensureAuthorized
  , ensureCurrentOrganization = helpers.ensureCurrentOrganization
  , ensureCurrentTeam = helpers.ensureCurrentTeam
  , makeRequest = helpers.makeRequest
  , separateProperties = helpers.separateProperties;

  function combineProperties(obj, callback){
    obj = _.extend({}, obj.properties, _.omit(obj, 'properties'));

    if (_.isFunction(callback)) {
      callback(obj);
    }

    return obj;
  }

  //////
  // PROJECTS
  //////

  app.get('/api/projects',
    makeRequest({
      path: '/res/projects',
      setup: function(req, res, next){
        _.defaults(req.query, {
          project_label: 'ALL',
          index_name: 'StagedProjects'
        });

        next(req, res);
      },
      translate: function(body, next){
        next(_.map(body, combineProperties));
      }
    }));

  app.get('/api/projects/:label',
    function(req, res){
      var project_label = req.params.label,
        index_name = req.query.index_name || 'StagedProjects';

      if (!project_label) {
        res.send(301);

      } else {
        request({
          method: 'GET',
          uri: [
            app.get('modelUrl'),
            'api/project/devices',
            project_label,
            index_name
          ].join('/'),
          headers: {
            currentUser: req.user.email,
            access_token: req.user.access_token,
            clientSecret: app.get('clientSecret')
          }
        }, function(err, resp, body){
          var project = {devices: [], rels: []};

          if (err) {
            req.flash('error', err.message);
            console.log('error!:', err);
            res.redirect('/ia');

          } else if (resp.statusCode < 200 || resp.statusCode > 299) {
            console.log(resp.statusCode, body);
            res.send(resp.statusCode);

          } else {
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

            res.send(project);
          }
        });
      }
    });

  app.post('/api/projects', ensureAuthorized(['vendor_admin']),
    makeRequest({
      path: '/res/projects',
      setup: function(req, res, next){
        req.body = _.pick(req.body, [
          'display_name',
          'site_label',
          'latitude',
          'longitude',
          'elevation',
          'index_name'
        ]);

        next(req, res);
      },
      translate: combineProperties
    }));

  app.put('/api/projects/:label', ensureAuthorized(['vendor_admin']),
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
        'index_name',
        'type',
        'kpis'
      ]),
      translate: combineProperties
    }));

  app.del('/api/projects/:label', ensureAuthorized(['vendor_admin']),
    makeRequest({
      path: '/res/projects',
      setup: function(req, res, next){
        _.extend(req.body, {
          project_label: req.params.label,
          verify: 'delete'
        });

        next(req, res);
      }
    }));

  app.post('/api/projects/edit', ensureAuthorized(['vendor_admin']),
    makeRequest({
      path: '/res/edit'
    }));

  app.put('/api/projects/:label/edit', ensureAuthorized(['vendor_admin']),
    makeRequest({
      path: '/res/edit',
      setup: function(req, res, next){
        _.extend(req.body, {
          project_label: req.params.label,
          lock: req.body.lock ? 'true' : 'false'
        });

        next(req, res);
      }
    }));

  //////
  // TEAM PROJECTS
  //////

  app.get('/api/teamprojects/:team_id', ensureCurrentOrganization, ensureCurrentTeam,
    makeRequest({
      path: '/res/teamprojects',
      setup: function(req, res, next){
        var teamId = req.params.team_id.split('_');
        req.query.org_label = teamId[0];
        req.query.team_label = teamId[1];
        if(req.user.org_label === teamId[0] || req.user.role === 'vendor_admin'){
          next(req, res);
        } else {
          res.send(403, 'Not authorized to see this team.');
        }
      },
      translate: function(data, next){
        console.log('PROOOOOOOOJECTS', data);
        next(data.projects);
      }
    })
  );

  app.post('/api/teamprojects', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/teamprojects'
    })
  );

  app.del('/api/teamprojects', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/teamprojects'
    })
  );

  //////
  // ORG PROJECTS
  //////

  app.get('/api/orgprojects/', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/teamprojects',
      setup: function(req, res, next){
        req.query.team_label = 'ADMIN';
        next(req, res);
      },
      translate: function(data, next){
        next(data.projects);
      }
    })
  );
};
