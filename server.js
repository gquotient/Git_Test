/**
 * Module dependencies.
 */

var express = require('express')
  , stylus = require('stylus')
  , _ = require('lodash')
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , RedisStore = require('connect-redis')(express)
  , LocalStrategy = require('passport-local').Strategy;

/**
 * Stub out some users.
 */

var User = {
  users: [
    {username: "jwin", password: "1234", name: "Justin", id: 1},
    {username: "jkyle", password: "1234", name: "Kyle", id: 2}
  ],
  findBy: function(field, value, callback){
    var currentuser = _.find(this.users, function(user){
      return user[field] === value;
    });

    if(currentuser){
      callback(null, currentuser);
    }
  },
  verifyPassword: function(user, password){
    return user.password === password;
  }
};

/**
 * Setup Passport
 */

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findBy("username", username, function(err, user){
      if( User.verifyPassword(user, password) ){
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect password.' });
      }
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(currentUser, done) {
  User.findBy("username", currentUser.username, function (err, user) {
    done(err, user);
  });
});

/*
 * Configure Express App
 */

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3005);
  app.use(stylus.middleware({
    debug: true,
    src: path.join(__dirname, 'public')
  }));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ store: new RedisStore, secret: 'adamantium',cookie: { secure: false, maxAge:86400000 } }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use( function(req, res){
    var newUrl = req.protocol + '://' + req.get('Host') + '/#' + req.url;
    res.redirect(newUrl);
  } );
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/*
 * Basic routing (temporary).
 */

app.all('/api/*', ensureAuthenticated);

app.get('/api/users',
  function(req, res){
    res.json({currentUser: req.user, data: User.users});
});

app.post('/login',
passport.authenticate('local'),
function(req, res) {
  res.json(req.user);
});

app.get('/logout',
  function(req, res){
    // req.logout();
    req.session.destroy();
    res.redirect('/login')
  })

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.send(401);
}

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
