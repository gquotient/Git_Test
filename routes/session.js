var passport = require('passport')
  , DrakerIA6Strategy = require('../lib/strategies/passport-draker-ia6').Strategy;

module.exports = function(app){
  var ensureAuthenticated = require('./helpers')(app).ensureAuthenticated;

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
    if (req.user.role === 'vendor_admin') {
      console.log("vendor_admin role; setting cookie maxAge to null; user: " + req.user.name);
      req.session.cookie.maxAge = null;
    }    
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
  app.get('/logout', ensureAuthenticated,
    function(req, res){
      DrakerIA6Strategy.logout(req, res, app, function(req, res, post_res) {
      });
      // req.logout();
      req.session.destroy();
      res.redirect('/login');
    });

};
