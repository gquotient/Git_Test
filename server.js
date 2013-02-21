/**
 * Module dependencies.
 */

var express = require('express')
  , stylus = require('stylus')
  , _ = require('lodash')
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

/**
 * Stub out some users.
 */

var User = {
  users: [
    {username: "jwin", password: "1234", name: "Justin", id: 1},
    {username: "jkyle", password: "1234", name: "Kyle", id: 2}
  ],
  findById: function(id){
    _.find(this.users, function(user){
      return user.id === id;
    });
  }
}

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

    if (err) { return done(err); }
    
    if (!validUser) {
      return done(null, false, { message: 'Incorrect username or password.' });
    }
    
    return done(null, user);

  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
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
  app.use(express.cookieParser());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'adamantium' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.methodOverride());
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

 app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: false
  })
);


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
