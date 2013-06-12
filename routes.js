
var fs = require('fs')
  , passport = require('passport')
  , DrakerIA6Strategy = require('./lib/strategies/passport-draker-ia6').Strategy
  , http = require('http')
  , _ = require('lodash')
  , request = require('request')
  , roles;



fs.readFile('./roles.json', 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    } else {
      roles = JSON.parse(data);
    }
  }
);

// Route Middleware

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  else {
    if(req.url !== '/reset' || req.url !== '/login') { req.session.redirectUrl = req.url; }
    res.redirect('/login');
  }
}

function ensureAuthorized(roles){
  return function(req, res, next) {
    if ( _.contains(roles, req.user.role) ){
      next();
    } else {
      req.flash('error', 'Unauthorized');
      res.redirect('/ia');
    }
  };
}

function ensureCurrentUser(req, res, next) {
  if(req.user.user_id === req.body.user_id) {
    next();
  } else {
    req.flash('error', 'Unauthorized');
    res.redirect('/ia');
  }
}

/*
 * Basic routing (temporary).
 */

module.exports = function(app){

  app.all('/', ensureAuthenticated, function(req, res){
    res.redirect('/ia');
  });

  app.all('/ia', ensureAuthenticated, function(req, res){
    var portfolios, projects;

    var requestOptions = {
      method: 'GET',
      headers: { 'currentUser': req.user.email, 'access_token': req.user.access_token, 'clientSecret': app.get('clientSecret') },
      uri: app.get('modelUrl') + '/res/portfolios'
    };

    request(requestOptions, function(error, response, portfolios){

      requestOptions.uri = app.get('modelUrl') + '/res/teamprojects';

      request(requestOptions, function(error, response, projects){

        res.render('index', {
          user: JSON.stringify({
            name: req.user.name,
            email: req.user.email,
            role: roles[req.user.role]
          }),
          portfolios: portfolios,
          projects: JSON.stringify(JSON.parse(projects).projects || []),
          locale: req.user.locale || req.acceptedLanguages[0].toLowerCase()
        });
      });
    });
  });

  app.all('/ia/*', ensureAuthenticated, function(req, res){
    var newUrl = req.url.split('/').slice(2).join('/');
    res.redirect( req.protocol + '://' + req.get('Host') + '/ia/#/' + newUrl );
  });


  app.get('/login', function(req, res){
    if (req.isAuthenticated() ) {
      if (req.session.redirectUrl) {
        res.redirect(req.session.redirectUrl);
      } else {
        res.redirect('/ia');
      }
    } else {
      res.render('login', { flash: req.flash('error') });
    }
  });

  app.post('/login',
    passport.authenticate('draker-ia6',
    {
      successRedirect: '/reset',
      failureRedirect: '/login',
      failureFlash: true
    }
  ));

  /* Reset Password */
  app.get('/reset', ensureAuthenticated, function(req, res){
    if( req.user.firsttime ){
      res.render('resetpassword', { flash: req.flash('error') });
    } else {
      if (req.session.redirectUrl) {
        res.redirect(req.session.redirectUrl);
      } else {
        res.redirect('/ia');
      }
    }
  });

  app.post('/reset', function(req, res){
    if (req.body.password_new === req.body.password_check) {
      if (req.body.password_new.length > 5) {
        DrakerIA6Strategy.reset(req, res, app, function(req, res, post_res) {
          if ( post_res.status === 200 ) {
            res.redirect('/ia');
          } else {
            if ( post_res.message ) {
              req.flash( 'error', post_res.message );
            } else {
              req.flash( 'error', 'Unauthorized' );
            }
            res.redirect('/reset');
          }

        });
      } else {
        req.flash( 'error', 'New password is too short');
        res.redirect('/reset');
      }
    } else {
      req.flash( 'error', 'New passwords did not match');
      res.redirect('/reset');
    }
  });

  app.get('/token',
    passport.authenticate('draker-ia6', { failureRedirect: '/login', failureFlash: true }),
    function(req, res){
      req.session['draker-ia6'] = req.session.passport.user;
      /* res.render("index",checkSession(req)); */
      res.redirect('/reset');
    });

  /* Logout */
  app.get('/logout',
    function(req, res){
      DrakerIA6Strategy.logout(req, res, app, function(req, res, post_res) {
      });
      // req.logout();
      req.session.destroy();
      res.redirect('/login');
    });


  /*
   * API ROUTES
   */

  app.all('/api/*', ensureAuthenticated);

  app.get('/api/portfolios',
    makeRequest({
      path: '/res/portfolios'
    }));

  app.get('/api/portfolios/',
    makeRequest({
      path: '/res/portfolios'
    }));

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
            console.log('devices', body);
            if (err) {
              req.flash('error', err.message);
              console.log('error!:', err);
              res.redirect('/ia');

            } else if (resp.statusCode === 200) {
              body = JSON.parse(body);

              body.devices = _.reduce(body.devices, function(memo, device){
                if (_.has(device, 'device_type')) {
                  device.project_label = project.project_label;

                  if (device.renderings) {
                    device.renderings = JSON.parse(device.renderings);
                  }

                  memo.push(device);
                }

                return memo;
              }, []);

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

  function separateProperties(root, ignore){
    return function(req, res, next){
      req.body = _.reduce(req.body, function(memo, value, key){
        if (_.contains(root, key)) {
          memo[key] = value;

        } else if (!_.contains(ignore, key)) {
          if (_.isPlainObject(value)) {
            value = JSON.stringify(value);
          }

          memo.properties[key] = value;
        }
        return memo;
      }, {properties: {}});

      req.body.properties = JSON.stringify(req.body.properties);

      next(req, res);
    };
  }

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

  app.all('/api/relationships',
    makeRequest({
      path: '/res/relationships',
    }));

  //////
  // TEAMS
  //////

  app.get('/api/teams', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/teams',
      setup: function(req, res, next){
        if(req.user.role === 'vendor_admin'){
          req.query.org_label = 'ALL';
        }
        next(req, res);
      },
      translate: function(data, next){
        next(data.teams);
      }
    }));

  app.get('/api/teams/:team_id/users', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/userteammgt',
      setup: function(req, res, next){
        var teamId = req.params.team_id.split('_');
        req.query.org_label = teamId[0];
        req.query.team_label = teamId[1];
        if(req.user.org_label === teamId[0] || req.user.role === 'vendor_admin'){
          next(req, res);
        } else {
          console.log('You\'re not allowed to look at that team.');
        }
      }
    }));

  app.post('/api/teams', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/teams'
    }));

  app.put('/api/teams', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/teams'
    }));


  app.put('/api/user_team', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/userteammgt'
    }));

  app.del('/api/user_team', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/userteammgt'
    }));


  ////////
  // ORGANIZATIONS
  ///////

  app.get('/api/organizations', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/organizations'
    }));

  app.get('/api/organizations/:org_label/users', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/users',
      setup: function(req, res, next){
        console.log(req.user.role);
        if(req.user.org_label === req.params.org_label || req.user.role === 'vendor_admin'){
          next(req, res);
        } else {
          console.log('You\'re not allowed to look at that organization.');
        }
      }
    }));


  //////
  // USERS
  //////

  // Get all users
  app.get('/api/users', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/users'
    }));

  // app.get('/api/:org_label/users/', ensureAuthorized(['vendor_admin', 'admin']),
  //   makeRequest({
  //     path: '/res/users'
  //   }));

  app.put('/api/users', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/user'
    }));

  app.put('/api/users/current', ensureCurrentUser,
    makeRequest({
      path: '/res/user'
    }));

  app.post('/api/users', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/usermgt'
    }));

  app.put('/api/reset_password', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/usermgt'
    }));

  ///////
  // Data
  /////

  app.post('/api/timeline',
    function(req, res){
      request({
        method: 'POST',
        uri: app.get('dataUrl') + '/api/timeline?timezone=' + req.query.timezone,
        body: JSON.stringify(req.body),
        headers: {
          'Content-Type': 'application/json'
        }
      }, function(err, response, body){
        res.end(body);
      });

    });

  ///////
  // Alarms
  /////

  app.get('/api/issues',
    function(req, res){
      fs.readFile('./data/json/issues.json', 'utf8', function (err, data) {
        if (err) {
          return console.log(err);
        }
        res.end(data);
      });
    });

  ///////
  // Alarms
  /////

  app.get('/api/issues',
    function(req, res){
      fs.readFile('./data/json/issues.json', 'utf8', function (err, data) {
        if (err) {
          return console.log(err);
        }
        res.end(data);
      });
    });


  ////////
  // makeRequest needs access to 'app', which is why it's in the routes function.
  // Can move later.
  ///////

  function makeRequest(options){
    var _request = function(req, res){

      var opts = _.extend({
        method: req.method,
        host: app.get('modelUrl'),
        path: '',
        headers: {
          currentUser: req.user.email,
          access_token: req.user.access_token,
          clientSecret: app.get('clientSecret')
        }
      }, options);

      opts.uri = opts.host + opts.path;

      if (req.query) {
        opts.qs = _.extend({}, req.query);
      }

      if (req.body) {
        if (req.method === 'DELETE') {
          opts.qs = _.extend({}, opts.qs, req.body);
        } else {
          opts.form = _.extend({}, req.body);
        }
      }

      request(opts, function(error, response, body){
        if (error) {
          req.flash('error', error.message);
          console.log('error!:', error);
          res.redirect('/ia');
        } else if (response.statusCode !== 200) {
          console.log('error!:', response.statusCode, body);
          res.send(response.statusCode);
        } else {
          console.log(body);

          if (opts.translate) {
            opts.translate(JSON.parse(body), function(translatedData){
              res.end(JSON.stringify(translatedData));
            });
          } else {
            res.end(body);
          }
        }
      });
    };

    if (options.setup) {
      return function(req, res){
        options.setup(req, res, _request);
      };

    } else {
      return _request;
    }
  }

};
