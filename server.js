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
  , DrakerIA6Strategy = require('./lib/strategies/passport-draker-ia6').Strategy
  , fs = require('fs');

/**
 * , LocalStrategy = require('passport-local').Strategy
 */

var port = process.env.PORT || 3005;

/**
 * Stub out some users.
 */

var User = {
  users: [
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
  // app.use( function(req, res){
  //   var newUrl = req.protocol + '://' + req.get('Host') + '/ia/#' + req.url;
  //   res.redirect(newUrl);
  // } );
});

app.configure('development', function(){
  app.use(express.errorHandler());
  app.set('clientID', 'IA6_0.1');
  app.set('clientSecret', 'ed75d8d3a96ef67041b52e057a5c86c3');
  app.set('callbackURL', 'http://127.0.0.1:' + port + '/token');
});

/**
 * Setup Passport
 */

passport.use(new DrakerIA6Strategy( {
    clientID: app.get('clientID'),
    clientSecret: app.get('clientSecret'),
    callbackURL: app.get('callbackURL')
  },
  function(token, tokenSecret, profile, done) {
    return done(null, profile);
  }
));

passport.serializeUser(function(user, done) {
  // console.log('serialize user', user)
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  // console.log('deserialize user', user)
  done(null, user);
});

/*
 * Basic routing (temporary).
 */

app.all('/', ensureAuthenticated, function(req, res){
  res.redirect('/ia');
});

app.all('/ia', ensureAuthenticated, function(req, res){

  res.render(
    'index',
    {
      user: '{ "username": "' + req.user.name + '" }',
      locale: (req.user.locale) ? req.user.locale : req.acceptedLanguages[0]
    }
  );
});

app.all('/ia/*', ensureAuthenticated, function(req, res){
  var newUrl = req.url.split('/').slice(2).join('/');
  console.log( req.protocol + '://' + req.get('Host') + '/ia/#/' + newUrl );
  res.redirect( req.protocol + '://' + req.get('Host') + '/ia/#/' + newUrl );
});


app.get('/login', function(req, res){
  res.render('login', { flash: req.flash('error') });
});

app.post('/login',
  passport.authenticate('draker-ia6',
  {
    successRedirect: '/reset',
    failureRedirect: '/login',
    failureFlash: true
  }
));

app.get('/reset', ensureAuthenticated, function(req, res){
  if( req.user.firsttime ){
    res.redirect('/ia/portfolios');
  } else {
    res.redirect('/ia');
  }
})

app.get('/token',
  passport.authenticate('draker-ia6', { failureRedirect: '/login', failureFlash: true }),
  function(req, res){
    req.session["draker-ia6"] = req.session["passport"]["user"];
    /* res.render("index",checkSession(req)); */
    res.redirect('/reset')
  }
);
 

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
    fs.readFile('./data/json/portfolios.json', 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      res.end(data);
    });
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
