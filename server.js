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
  , flash = require('connect-flash')
  , LocalStrategy = require('passport-local').Strategy
  , fs = require('fs');

/**
 * Stub out some users.
 */

var User = {
  users: [
    {username: "jwin", password: "1234", name: "Justin", id: 1},
    {username: "jkyle", password: "1234", name: "Kyle", id: 2},
    {username: "rock", password: "1234", name: "Rock", id: 3}
  ],
  findBy: function(field, value, callback){
    var currentuser = _.find(this.users, function(user){
      return user[field] === value;
    });

    if( currentuser ){
      callback(null, currentuser);
    } else {
      callback(null, false, { message: "User not found." });
    }
  },
  verifyPassword: function(user, password){
    return user.password === password;
  }
};

/**
 * Stub out some random data.
 */

var Projects = {
  projects: [
    {name: "Foo", color: "blue", id: 1},
    {name: "Bar", color: "red", id: 2}
  ],
  findBy: function(field, value, callback){
    var currentproject = _.find(this.projects, function(project){
      return project[field] === value;
    });

    if(currentproject){
      callback(null, currentproject);
    }
  }
};

/**
 * Setup Passport
 */

passport.use(new LocalStrategy(
  function(username, password, done) {

    User.findBy("username", username, function(err, user){
      if( err ){ return done(err); }

      if( !user ) {
        return done(null, false, { message: 'Bwahh ha ha ha ha. No user by that name.' });
      }

      if( !User.verifyPassword(user, password) ){
        return done(null, false, { message: 'Awwwwww. Did you forget your password?'});
      }

      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.username);
});

passport.deserializeUser(function(username, done) {
  User.findBy("username", username, function (err, user) {
    done(err, user);
  });
});

/*
 * Configure Express App
 */

var app = express();
app.configure(function(){
  app.set('port', process.env.PORT || 3005);
  app.set('view engine', 'hbs');
  app.set('views', __dirname + '/templates');
  app.use( stylus.middleware({
    src: __dirname
  }) );
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ store: new RedisStore, secret: 'adamantium',cookie: { secure: false, maxAge:86400000 } }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  app.use(app.router);
  app.use('/public', express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});



app.all('/', ensureAuthenticated, function(req, res){
  res.redirect('/ia');
});

app.all('/ia', ensureAuthenticated, function(req, res){
  res.render(
    'index',
    {
      user: '{ "username": "' + req.user.username + '"}',
      locale: (req.user.locale) ? req.user.locale : req.acceptedLanguages[0]
    }
  );
});

app.all('/ia/*', ensureAuthenticated, function(req, res){
  var newUrl = req.url.split('/').slice(2).join('/');
  console.log( req.protocol + '://' + req.get('Host') + '/ia/#/' + newUrl );
  res.redirect( req.protocol + '://' + req.get('Host') + '/ia/#/' + newUrl );
});

/* Login */
app.get('/login', function(req, res){
  if (req.isAuthenticated() ) {
    res.redirect('/ia');
  } else {
    res.render('login', { flash: req.flash('error') });
  }
});

app.post('/login',
passport.authenticate('local',
  {
    successRedirect: '/ia',
    failureRedirect: '/login',
    failureFlash: true
  }
));

/* Reset Password */
app.get('/resetpassword', function(req, res){
  res.render('resetpassword', { flash: req.flash('error') });
});

/* Logout */
app.get('/logout',
  function(req, res){
    // req.logout();
    req.session.destroy();
    res.redirect('/login');
  });

/* API */
app.all('/api/*', ensureAuthenticated);

app.get('/api/users',
  function(req, res){
    res.json({currentUser: req.user, data: User.users});
});

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
      res.end(data)
    })
  });

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  else {
    res.redirect('/login');
  }
}

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
