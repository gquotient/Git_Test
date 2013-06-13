
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
      uri: app.get('modelUrl') + '/res/user'
    };


    // Don't judge me for this. I'll fix it later.
    var myTeams,
        myProjects,
        myPortfolios;

    Q.
      fcall( function(){
        var myUserDef = Q.defer();
        // console.log('user')
        request(requestOptions, function(error, response, user){
          myTeams = JSON.stringify(JSON.parse(user).teams);
          console.log(myTeams);
          myUserDef.resolve(user);
        });

        return myUserDef.promise;
      })
      .then( function(){
        var myPortfoliosDef = Q.defer();
        // console.log('portfolios');
        requestOptions.uri = app.get('modelUrl') + '/res/portfolios';
        request(requestOptions, function(error, response, portfolios){
          myPortfolios = portfolios;
          myPortfoliosDef.resolve(portfolios);
        });

        return myPortfoliosDef.promise;

      })
      .then( function(myPortfolios){
        var myProjectsDef = Q.defer();
        // console.log('projects');
        requestOptions.uri = app.get('modelUrl') + '/res/teamprojects';
        request(requestOptions, function(error, response, projects){
          myProjects = projects;
          console.log('projects')
          myProjectsDef.resolve(projects);
        });

        return myProjectsDef.promise;
      })
      .then( function(obj){
        console.log('render');
        res.render('index', {
          user: JSON.stringify({
            name: req.user.name,
            email: req.user.email,
            teams: myTeams,
            role: roles[req.user.role]
          }),
          portfolios: myPortfolios,
          projects: JSON.stringify(JSON.parse(myProjects).projects),
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
