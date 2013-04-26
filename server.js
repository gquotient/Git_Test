/**
 * Module dependencies.
 */

var express = require('express')
  , stylus = require('stylus')
  , nib = require('nib')
  , _ = require('lodash')
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , RedisStore = require('connect-redis')(express)
  , flash = require('connect-flash')
  , DrakerIA6Strategy = require('./lib/strategies/passport-draker-ia6').Strategy
  , fs = require('fs')
  , hbs = require('hbs')
  , routes = require('./routes');

/*
 * Configure Express App
 */

var app = express();

app.configure(function(){
  var compile = function(str, path) {
    return stylus(str)
      .set('filename', path)
      .set('compress', true) // minify
      .define('url', stylus.url()) // Turn images to data URIs
      .use(nib()); // Use nib for cross-browser CSS3 help
  };

  app.set('port', process.env.PORT || 3005);
  app.set('view engine', 'hbs');
  app.set('views', __dirname + '/templates');
  app.use(
    stylus
      .middleware({
        src: __dirname,
        compile: compile // Use custom compile function
      })
  );
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ store: new RedisStore(), secret: 'adamantium',cookie: { secure: false, maxAge:86400000 } }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  app.use(app.router);
  app.use('/public', express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  console.log("Using Development");
  app.use(express.errorHandler());
  app.set('clientID', 'IA6_0.1');
  app.set('clientSecret', 'ed75d8d3a96ef67041b52e057a5c86c3');
  app.set('callbackURL', 'http://127.0.0.1:' + app.get('port') + '/token');
  app.set('authPort', 8431);
  app.set('authUrl', '127.0.0.1');
});

app.configure('development-remote', function(){
  console.log("Using Remote");
  app.use(express.errorHandler());
  app.set('clientID', 'IA6_0.1');
  app.set('clientSecret', 'ed75d8d3a96ef67041b52e057a5c86c3');
  app.set('callbackURL', 'http://127.0.0.1:' + app.get('port') + '/token');
  app.set('authorizationURL', 'http://auth.stage.intelligentarray.com/ia/oauth2/auth');
  app.set('tokenURL', 'http://auth.stage.intelligentarray.com/ia/oauth2/token');
  app.set('authPort', 80);
  app.set('authUrl', 'auth.stage.intelligentarray.com');
});

/**
 * Setup Passport
 */

passport.use(new DrakerIA6Strategy( {
    clientID: app.get('clientID'),
    clientSecret: app.get('clientSecret'),
    callbackURL: app.get('callbackURL'),
    authorizationURL: app.get('authorizationURL'),
    tokenURL: app.get('tokenURL')
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
 * Register partials
 */

var headerTemplate = fs.readFileSync(__dirname + '/templates/partials/header.hbs', 'utf8');
hbs.registerPartial('sharedHeader', headerTemplate);

/*
 * Setup Routes
 */
routes(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
