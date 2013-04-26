
var fs = require('fs')
  , passport = require('passport')
  , DrakerIA6Strategy = require('./lib/strategies/passport-draker-ia6').Strategy;

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
                username: req.user.name,
                firstName: req.user.name.split(' ')[0],
                lastName: req.user.name.split(' ')[1],
                email: req.user.email
              }),
              portfolios: portfolios,
              projects: projects,
              locale: (req.user.locale) ? req.user.locale : req.acceptedLanguages[0]
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
      req.session['draker-ia6'] = req.session['passport']['user'];
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

  /* API */
  app.all('/api/*', ensureAuthenticated);

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

  app.get('/api/users', ensureAuthenticated, ensureAuthorized('vendor-admin'), function(req, res){

  });


  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    else {
      if(req.url !== '/reset' || req.url !== '/login') { req.session.redirectUrl = req.url; }
      res.redirect('/login');
    }
  }
};
