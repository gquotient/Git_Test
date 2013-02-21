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

  }
};

var users = [
  {username: "jwin", password: "1234", name: "Justin"},
  {username: "jkyle", password: "1234", name: "Kyle"}
];

/**
 * Setup Passport
 */

passport.use(new LocalStrategy(
  function(username, password, done) {
    var validUser = _.find(users, function(user){
      return user.username === username && user.password === password;
    });
    
    if (!validUser) {
      return done(null, false, { message: 'Incorrect username or password.' });
    }
    
    return done(null, validUser);

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

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3005);
  // app.set('views', __dirname + '/views');
  // app.set('view engine', 'hbs');
  app.use(stylus.middleware({
    debug: true,
    //Not sure why but this has to match the static assets path
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

 app.get('/api/gate',
  function(req, res){
    res.json({user:req.user})
  });

 app.post('/login',
  passport.authenticate('local'),
  function(req, res) {
    res.json({"user": req.user});
  });


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
