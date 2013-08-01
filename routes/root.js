
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

    var myTeams,
        myProjects,
        myPortfolios;

    Q.
      fcall( function(){
        var defer = Q.defer();

        request(requestOptions, function(error, response, userJSON){
          var user = JSON.parse(userJSON);
          // Until we have a default team option for the user, assume first team or last selected. Or, you know. No team at all.
          var team = user.default_team ? user.default_team : user.teams[0] ? user.teams[0][0] : 'No Team'; // Hack.
          req.session.team_label = req.session.team_label || team;
          req.session.org_label = user.org_label;
          myTeams = user.teams;

          defer.resolve(user);
        });

        return defer.promise;
      })
      .then( function(){
        var defer = Q.defer();

        requestOptions.uri = app.get('modelUrl') + '/res/teamportfolios?team_label='+req.session.team_label+'&org_label='+req.session.org_label;

        request(requestOptions, function(error, response, portfolios){
          myPortfolios = portfolios;

          defer.resolve(portfolios);
        });

        return defer.promise;
      })
      .then( function(myPortfolios){
        var defer = Q.defer();

        requestOptions.uri = app.get('modelUrl') + '/res/teamprojects?team_label'+req.session.team_label+'&org_label='+req.session.org_label;

        request(requestOptions, function(error, response, projects){
          // Portfolios returns as an array but projects returns as an array inside an object
          // (i.e. { projects: [] } )
          // sooooo, we have to do this to keep our stuff consistent
          myProjects = JSON.stringify(JSON.parse(projects).projects || []);

          defer.resolve(projects);
        });

        return defer.promise;
      })
      .then( function(obj){
        res.render('index', {
          user: JSON.stringify({
            name: req.user.name,
            email: req.user.email,
            teams: myTeams,
            currentTeam: req.session.team_label,
            currentOrganization: req.session.org_label,
            role: roles[req.user.role]
          }),
          portfolios: myPortfolios,
          projects: myProjects,
          locale: req.user.locale || req.acceptedLanguages[0].toLowerCase(),
          staticDir: app.get('staticDir') || 'app'
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
