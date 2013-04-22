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
  , hbs = require('hbs');

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

app.configure('development-local', function(){
  console.log("Using Development");
  app.use(express.errorHandler());
  app.set('clientID', 'IA6_0.1');
  app.set('clientSecret', 'ed75d8d3a96ef67041b52e057a5c86c3');
  app.set('callbackURL', 'http://127.0.0.1:' + port + '/token');
  app.set('authPort', 8431);
  app.set('authUrl', 'http://127.0.0.1');
});

app.configure('development', function(){
  console.log("Using Remote");
  app.use(express.errorHandler());
  app.set('clientID', 'IA6_0.1');
  app.set('clientSecret', 'ed75d8d3a96ef67041b52e057a5c86c3');
  app.set('callbackURL', 'http://127.0.0.1:' + port + '/token');
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
  Register partials
*/

var headerTemplate = fs.readFileSync(__dirname + '/templates/partials/header.hbs', 'utf8');
hbs.registerPartial('sharedHeader', headerTemplate);

/*
 * Basic routing (temporary).
 */

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
            user: '{ "username": "' + req.user.name + '" }',
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
        console.log( "Back from reset:" + post_res.status );
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
    req.session["draker-ia6"] = req.session["passport"]["user"];
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

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  else {
    req.session.redirectUrl = req.url;
    res.redirect('/login');
  }
}

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
