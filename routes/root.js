
var fs = require('fs')
  , _ = require('lodash')
  , request = require('request')
  , Q = require('q')
  , roles;


fs.readFile('./roles.json', 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    } else {
      roles = JSON.parse(data);
    }
  }
);

module.exports = function(app){
  
  var helpers = require('./helpers')(app),
      ensureAuthenticated = helpers.ensureAuthenticated;

  app.all('/', ensureAuthenticated, function(req, res){
    res.redirect('/ia');
  });

  app.all('/ia', ensureAuthenticated, function(req, res){

    var requestOptions = {
      method: 'GET',
      headers: { 'currentUser': req.user.email, 'access_token': req.user.access_token, 'clientSecret': app.get('clientSecret') },
      uri: app.get('modelUrl') + '/res/portfolios'
    };

    Q.
    fcall( function(){
      var myPortfolios = Q.defer();

      request(requestOptions, function(error, response, portfolios){
        myPortfolios.resolve(portfolios);
      });

      return myPortfolios.promise;

    })
    .then( function(myPortfolios){
      var myProjects = Q.defer();

      requestOptions.uri = app.get('modelUrl') + '/res/teamprojects';
      request(requestOptions, function(error, response, projects){
        myProjects.resolve({projects: projects, portfolios: myPortfolios});
      });

      return myProjects.promise;
    })
    .then( function(obj){

      res.render('index', {
        user: JSON.stringify({
          name: req.user.name,
          email: req.user.email,
          role: roles[req.user.role]
        }),
        portfolios: obj.portfolios,
        projects: JSON.stringify(JSON.parse(obj.projects).projects),
        locale: req.user.locale || req.acceptedLanguages[0].toLowerCase()
      });
    });

  });

  app.all('/ia/*', ensureAuthenticated, function(req, res){
    var newUrl = req.url.split('/').slice(2).join('/');
    res.redirect( req.protocol + '://' + req.get('Host') + '/ia/#/' + newUrl );
  });

  /*
   * API ROUTES
   */

  app.all('/api/*', ensureAuthenticated);









};
