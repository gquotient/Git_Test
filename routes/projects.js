var _ = require('lodash')
, request = require('request');

module.exports = function(app){

  var helpers = require('./helpers')(app)
  , ensureAuthorized = helpers.ensureAuthorized
  , ensureCurrentOrganization = helpers.ensureCurrentOrganization
  , ensureCurrentTeam = helpers.ensureCurrentTeam
  , makeRequest = helpers.makeRequest
  , separateProperties = helpers.separateProperties;


  //////
  // PROJECTS
  //////

  app.get('/api/projects',
    function(req, res, next){
      _.defaults(req.query, {
        project_label: 'ALL',
        index_name: 'StagedProjects'
      });

      next();
    },
    helpers.request({
      path: '/res/projects'
    }));

  app.get('/api/projects/:label',
    helpers.request({
      path: function(req){
        var project_label = req.params.label,
          index_name = req.query.index_name || 'StagedProjects';

        // Remove index_name from query string.
        delete req.query.index_name;

        return [
          '/api/project/devices',
          project_label,
          index_name
        ].join('/');
      },
      pipe: true
    }));


  var IGNORE_PROPS = [
    'id',
    'node_id',
    'index_name',
    'type',
    'kpis',
    'dataSources',
    'status',
    'statusValue',
    'editor'
  ];

  app.post('/api/projects', ensureAuthorized(['vendor_admin']),
    function(req, res, next){
      var body = req.body || {},
        props = _.omit(body, IGNORE_PROPS);

      _.each(props, function(value, key){
        if (_.isObject(value)) {
          props[key] = JSON.stringify(value);
        }
      });

      req.body = {
        site_label: body.site_label,
        index_name: body.index_name || 'AlignedProjects',
        properties: JSON.stringify(props)
      };

      next();
    },
    helpers.request({
      path: '/res/projects',
      middleware: true
    }),
    function(req, res){
      var body = _.isObject(res.body) ? res.body : {},
        props = _.omit(body.properties, 'label');

      _.extend(props, _.omit(body, 'properties'));

      res.send(res.statusCode, props);
    });

  app.put('/api/projects/:label', ensureAuthorized(['vendor_admin']),
    function(req, res, next){
      var body = req.body || {},
        props = _.omit(body, IGNORE_PROPS);

      _.each(props, function(value, key){
        if (_.isObject(value)) {
          props[key] = JSON.stringify(value);
        }
      });

      req.body = {
        project_label: req.params.label,
        node_id: body.node_id,
        properties: JSON.stringify(props)
      };

      next();
    },
    helpers.request({
      path: '/res/projects',
      middleware: true
    }),
    function(req, res){
      var body = _.isObject(res.body) ? res.body : {},
        props = _.omit(body.properties, 'label');

      _.extend(props, _.omit(body, 'properties'));

      res.send(res.statusCode, props);
    });

  app.del('/api/projects/:label', ensureAuthorized(['vendor_admin']),
    function(req, res, next){
      _.extend(req.body, {
        project_label: req.params.label,
        verify: 'delete'
      });

      next();
    },
    helpers.request({
      path: '/res/projects'
    }));

  app.post('/api/projects/commission', ensureAuthorized(['vendor_admin']),
    helpers.request({
      path: '/res/commission'
    }));

  app.post('/api/projects/edit', ensureAuthorized(['vendor_admin']),
    helpers.request({
      path: '/res/edit'
    }));

  app.put('/api/projects/:label/edit', ensureAuthorized(['vendor_admin']),
    function(req, res, next){
      _.extend(req.body, {
        project_label: req.params.label,
        lock: req.body.lock
      });

      next();
    },
    helpers.request({
      path: '/res/edit',
      middleware: true
    }),
    function(req, res){
      var body = res.body || {},
        message = _.isObject(body) ? body.message : body,
        match = /locked by ([^"]+)/.exec(message);

      if (match) {
        res.send({
          locked: true,
          editor: match[1]
        });
      } else {
        res.send(res.statusCode, res.body);
      }
    });

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
