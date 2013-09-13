
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
      ensureAuthenticated = helpers.ensureAuthenticated,
      parsePortfolioFilters = helpers.parsePortfolioFilters;


  app.all('/', ensureAuthenticated, function(req, res){
    res.redirect('/ia');
  });

  app.all('/ia', ensureAuthenticated, function(req, res){

    var requestOptions = {
      method: 'GET',
      headers: { 'currentUser': req.user.email, 'access_token': req.user.access_token, 'clientSecret': app.get('clientSecret') },
      uri: app.get('modelUrl') + '/res/user'
    };

    var user,
        myProjects,
        myPortfolios,
        equipment,
        everythingLoaded = Q.defer();

    var resolveEverythingLoaded = function(){
      if (myProjects && myPortfolios && equipment) {
        everythingLoaded.resolve();
      }
    };

    var defer = Q.defer();

    // Request the current user model
    request(requestOptions, function(error, response, userJSON){
      // Make sure the model is valid json
      try {
        user = JSON.parse(userJSON);
      }
      catch(e) {
        console.error('User JSON is malformed');
      }

      // Send 500 if no user model is returned
      if (!user) {
        res.send(500);
        return false;
      }

      // Until we have a default team option for the user, assume first team or last selected. Or, you know. No team at all.
      var team = user.default_team ? user.default_team : user.teams[0] ? user.teams[0][0] : 'No Team'; // Hack.
      req.session.team_label = req.session.team_label || team;
      req.session.org_label = user.org_label;

      // Handle errors
      // NOTE - We should probably abstract error handling to it's own module
      if (error) {
        console.log('***************************************');
        console.log('Model service returned an error:', error);
        console.log('***************************************');

        defer.reject();
        req.session.destroy();
        res.location('/login');
        res.render('login', { flash: 'There was an issue, please try logging in again.' });
      } else if (typeof user !== 'object') {
        console.log('***************************************');
        console.log('Something is wrong with the returned user model.');
        console.log('***************************************');

        defer.reject();
        req.session.destroy();
        res.location('/login');
        res.render('login', { flash: 'There was an issue, please try logging in again.' });
      } else {
        // If everything is happy, resolve the defer
        defer.resolve(user);
      }
    });

    // Get portfolios
    defer.promise.then( function(){
      requestOptions.uri = app.get('modelUrl') + '/res/teamportfolios?team_label='+req.session.team_label+'&org_label='+req.session.org_label;

      request(requestOptions, function(error, response, portfolios){
        myPortfolios = parsePortfolioFilters(portfolios);

        resolveEverythingLoaded();
      });
    });

    // Get projects
    defer.promise.then( function(){
      requestOptions.uri = app.get('modelUrl') + '/res/teamprojects?team_label'+req.session.team_label+'&org_label='+req.session.org_label;

      request(requestOptions, function(error, response, projects){
        // Portfolios returns as an array but projects returns as an array inside an object
        // (i.e. { projects: [] } )
        // sooooo, we have to do this to keep our stuff consistent
        myProjects = JSON.stringify(JSON.parse(projects).projects || []);

        resolveEverythingLoaded();
      });
    });

    fs.readFile('./data/json/equipment.json', 'utf8', function (err, data) {
      if (err) {
        return console.log(err);
      }

      equipment = data || '[]';

      resolveEverythingLoaded();
    });

    // Once user, portfolios and projects are loaded, render the index page with the bootstrapped data
    everythingLoaded.promise.then( function(obj){
      res.render('index', {
        user: JSON.stringify(_.extend({}, user, {
          currentTeam: req.session.team_label,
          currentOrganization: req.session.org_label,
          role: roles[req.user.role]
        })),
        portfolios: myPortfolios,
        projects: myProjects,
        equipment: equipment,
        locale: req.user.locale || req.acceptedLanguages[0].toLowerCase(),
        staticPath: app.get('staticPath')
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
