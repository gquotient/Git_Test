
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
        
        fs.readFile('./data/json/device_library.json', 'utf8', function (err, data) {
          if (err) {
            return console.log(err);
          }
          devices = data;
          res.render(
            'index',
            {
              user: JSON.stringify({
                name: req.user.name,
                email: req.user.email,
                role: roles[req.user.role]
              }
            ),
              portfolios: portfolios,
              projects: JSON.stringify(JSON.parse(projects).projects),
              devices: devices,
              locale: (req.user.locale) ?
              req.user.locale
            :
              req.acceptedLanguages[0].toLowerCase()
            }
          );
        }):
        
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
    // console.log( 'passwords:' + req.body.password + ':' + req.body.password_new + ':' + req.body.password_check );
    if (req.body.password_new === req.body.password_check) {
      if (req.body.password_new.length > 5) {
        console.log( 'post the password reset request' );
        DrakerIA6Strategy.reset(req, res, app, function(req, res, post_res) {
          console.log( 'Back from reset:' + post_res.status );
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
        // console.log( "Back from logout:" + post_res.status );
      });
      // req.logout();
      req.session.destroy();
      res.redirect('/login');
    });


  /*
   * API ROUTES
   */

  app.all('/api/*', ensureAuthenticated);

  app.get('/api/portfolios', makeRequest({
    host: app.get('modelUrl'),
    path: '/res/portfolios',
    method: 'GET'
  }));

  app.get('/api/portfolios/', makeRequest({
    host: app.get('modelUrl'),
    path: '/res/portfolios',
    method: 'GET'
  }));

  app.get('/api/projects/', makeRequest({
    host: app.get('modelUrl'),
    path: '/res/teamprojects',
    method: 'GET'
  }, function(data, next){
    next(data.projects);
  }));

  app.get('/api/projects/:project_label', makeRequest({
    host: app.get('modelUrl'),
    path: '/res/projects',
    method: 'GET'
  }));

  function separateProperties(list){
    return function(req, res, next){
      var properties = {};

      if (req.body) {
        req.body = _.reduce(req.body, function(memo, value, key){
          if (_.contains(list, key)) {
            memo[key] = value;
          } else {
            properties[key] = value;
          }
          return memo;
        }, {});

        req.body.properties = JSON.stringify(properties);
      }
      next();
    };
  }

  function mergeProperties(body, next){
    if (body.properties) {
      body = _.extend({},
        body.properties,
        _.omit(body, 'properties')
      );
    }

    if (body.children) {
      body.children = _.map(body.children, function(child){
        if (child.properties) {
          child = _.extend({},
            child.properties,
            _.omit(child, 'properties')
          );
        }
        return child;
      });
    }

    next(body);
  }

  //////
  // PROJECTS
  //////

  app.all('/api/projects',
    separateProperties([
      'id',
      'name',
      'site_label',
      'project_label',
      'latitude',
      'longitude',
      'elevation'
    ]),
    makeRequest({
      path: '/res/projects'
    },
    mergeProperties));

  //////
  // DEVICES
  //////

  app.all('/api/devices',
    separateProperties([
      'id',
      'project_label',
      'parent_id',
      'relationship_label'
    ]),
    makeRequest({
      path: '/res/devices'
    },
    mergeProperties));

  //////
  // TEAMS
  //////

  app.get('/api/teams', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/teams'
    }, function(data, next){
      next(data.teams);
    }));

  app.put('/api/teams', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/teams'
    }));

  app.post('/api/teams', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/teams'
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

  ////////
  // ORGANIZATIONS
  ///////

  app.get('/api/organizations', ensureAuthorized(['vendor_admin', 'admin']),
    makeRequest({
      path: '/res/organizations'
    }));

  ///////
  // Data
  /////

  app.get('/api/arrayPower',
    function(req, res){
      fs.readFile('./data/json/arrayPower.json', 'utf8', function (err, data) {
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

  function makeRequest(options, translate){
    // return function(req, res, next){
    //   console.log(req.params);
    //   if(options.method === 'GET' || options.method === 'DELETE') {
    //     var requestOptions = _.extend(options, {
    //       headers: { 'currentUser': req.user.email, 'access_token': req.user.access_token, 'clientSecret': app.get('clientSecret') },
    //       uri: options.host + options.path,
    //       qs: _.extend(req.params, req.query, {})
    //     });
    //   } else {
    //     var requestOptions = _.extend(options, {
    //       headers: { 'currentUser': req.user.email, 'access_token': req.user.access_token, 'clientSecret': app.get('clientSecret') },
    //       uri: options.host + options.path,
    //       form: _.extend(req.body, {})
    //     });
    return function(req, res){
      opts = _.extend({
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
      console.log(opts.method, opts.uri);

      if (req.params) {
        opts.qs = _.clone(req.query);
      }

      if (req.body) {
        opts.form = _.clone(req.body);
      }

      request(opts, function(error, response, body){
        if (error) {
          req.flash('error', error.message);
          console.log('error!:', error);
          res.redirect('/ia');
        } else {
          if (translate) {
            translate(JSON.parse(body), function(translatedData){
              res.end(JSON.stringify(translatedData));
            });
          } else {
            console.log(response);
            console.log(body);
            res.end(body);
          }
        }
      });
    };
  }

};
