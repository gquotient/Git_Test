
/**
 * Module dependencies.
 */

var express = require('express')
  , stylus = require('stylus')
  , http = require('http')
  , path = require('path');

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

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
