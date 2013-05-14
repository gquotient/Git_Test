
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
    // Load portfolios.
    fs.readFile('./data/json/portfolios.json', 'utf8', function (err, data) {
        if (err) {
          return console.log(err);
        }
        portfolios = data;

        // Load projects.
        fs.readFile('./data/json/projects.json', 'utf8', function (err, data) {
          if (err) {
            return console.log(err);
          }
          projects = data;

          // Render the response.
          res.render(
            'index',
            {
              user: JSON.stringify({
                name: req.user.name,
                email: req.user.email,
                role: roles[req.user.role]
              }),
              portfolios: portfolios,
              projects: projects,
              locale: (req.user.locale) ?
                req.user.locale
              :
                req.acceptedLanguages[0].toLowerCase()
            }
          );
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
    }
  );

  /* Logout */
  app.get('/logout',
    function(req, res){
      DrakerIA6Strategy.logout(req, res, app, function(req, res, post_res) {
        // console.log( "Back from logout:" + post_res.status );
      });
      // req.logout();
      req.session.destroy();
      res.redirect('/login');
    }
  );


  /*
   * API ROUTES
   */

  app.all('/api/*', ensureAuthenticated);

  // app.get('/api/portfolios', makeRequest({
  //   host: app.get('modelUrl'),
  //   path: '/res/portfolios',
  //   method: 'GET'
  // }))

  // app.get('/api/portfolios/:label', makeRequest({
  //   host: app.get('modelUrl'),
  //   path: '/res/portfolios',
  //   method: 'GET'
  // }))


  // app.get('/api/projects', makeRequest({
  //   host: app.get('modelUrl'),
  //   path: '/res/projects',
  //   method: 'GET'
  // }))

  app.get('/api/portfolios',
    function(req, res){
      fs.readFile('./data/json/portfolios.json', 'utf8', function (err, data) {
        if (err) {
          return console.log(err);
        }
        res.end(data);
      });
    });

  app.get('/api/projects',
    function(req, res){
      fs.readFile('./data/json/projects.json', 'utf8', function (err, data){
        if (err) {
          return console.log(err);
        }
        res.end(data);
      });
    });

  //////
  // TEAMS
  //////

  app.get('/api/teams', ensureAuthorized(['vendor_admin', 'admin']), makeRequest(
    {
      host: app.get('modelUrl'),
      path: '/res/teams',
      method: 'GET',
      setup: function(req, res, next){
        if(req.user.role === 'vendor_admin'){
          req.params.org_label = 'ALL';
        }
        next(req, res);
      },
      translate: function(data, next){
        next(data.teams);
      }
    }
  ));

  app.get('/api/teams/:team_id/users', ensureAuthorized(['vendor_admin', 'admin']), makeRequest(
    {
      host: app.get('modelUrl'),
      path: '/res/userteammgt',
      method: 'GET',
      setup: function(req, res, next){
        var teamId = req.params.team_id.split('_');
        req.params.org_label = teamId[0];
        req.params.team_label = teamId[1];
        if(req.user.org_label === teamId[0] || req.user.role === 'vendor_admin'){
          next(req, res);
        } else {
          console.log('You\'re not allowed to look at that team.');
        }
      }
    }
  ));

  app.put('/api/teams', ensureAuthorized(['vendor_admin', 'admin']), makeRequest(
    {
      host: app.get('modelUrl'),
      path: '/res/teams',
      method: 'PUT'
    })
  );

  app.post('/api/teams', ensureAuthorized(['vendor_admin', 'admin']), makeRequest(
    {
      host: app.get('modelUrl'),
      path: '/res/teams',
      method: 'POST'
    })
  );

  // app.get('/api/:org_label/:team_label', ensureAuthorized(['vendor_admin', 'admin']), makeRequest(
  //   {
  //     host: app.get('modelUrl'),
  //     path: '/res/userteammgt',
  //     method: 'GET'
  //   }
  // ));

  //////
  // USERS
  //////

  // Get all users  
  app.get('/api/users', ensureAuthorized(['vendor_admin', 'admin']), makeRequest(
    {
      host: app.get('modelUrl'),
      path: '/res/users',
      method: 'GET'
    }
  ));

  // app.get('/api/:org_label/users/', ensureAuthorized(['vendor_admin', 'admin']), makeRequest(
  //   {
  //     host: app.get('modelUrl'),
  //     path: '/res/users',
  //     method: 'GET'
  //   }
  // ));

  app.put('/api/users', ensureAuthorized(['vendor_admin', 'admin']), makeRequest(
    {
      host: app.get('modelUrl'),
      path: '/res/user',
      method: 'PUT'
    }
  ));

  app.put('/api/users/current', ensureCurrentUser, makeRequest(
    {
      host: app.get('modelUrl'),
      path: '/res/user',
      method: 'PUT'
    }
  ));

  app.post('/api/users', ensureAuthorized(['vendor_admin', 'admin']), makeRequest(
    {
      host: app.get('modelUrl'),
      path: '/res/usermgt',
      method: 'POST'
    }
  ));

  app.put('/api/reset_password', ensureAuthorized(['vendor_admin', 'admin']), makeRequest(
    {
      host: app.get('modelUrl'),
      path: '/res/usermgt',
      method: 'PUT'
    }
  ));

  ////////
  // ORGANIZATIONS
  ///////

  app.get('/api/organizations', ensureAuthorized(['vendor_admin']), makeRequest(
    {
      host: app.get('modelUrl'),
      path: '/res/organizations',
      method: 'GET'
    })
  );


  ////////
  // makeRequest needs access to 'app', which is why it's in the routes function.
  // Can move later.
  ///////

  function makeRequest(options){
    return function(req, res, next){

      var _request = function(){
        var requestOptions;
        if(options.method === 'GET' || options.method === 'DELETE') {
          requestOptions = _.extend(options, {
            headers: { 'currentUser': req.user.email, 'access_token': req.user.access_token, 'clientSecret': app.get('clientSecret') },
            uri: options.host + options.path,
            qs: _.extend(req.params, {})
          });
        } else {
          requestOptions = _.extend(options, {
            headers: { 'currentUser': req.user.email, 'access_token': req.user.access_token, 'clientSecret': app.get('clientSecret') },
            uri: options.host + options.path,
            form: _.extend(req.body, {})
          });
        }

        request(requestOptions, function(error, response, body){
          if (error) {
            req.flash('error', error.message);
            console.log('error!:', error);
            res.redirect('/ia');
          } else {
            console.log(body);

            if (options.translate) {
              options.translate(JSON.parse(body), function(translatedData){
                res.end(JSON.stringify(translatedData));
              });
            } else {
              res.end(body);
            }
          }
        });
      };

      if (options.setup) {
        options.setup(req, res, _request);
      } else {
        _request(req, res);
      }
    };
  }

};
