var _ = require('lodash')
, fs = require('fs')
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

  var helpers = require('./helpers')(app)
  , ensureAuthenticated = helpers.ensureAuthenticated
  , parsePortfolioFilters = helpers.parsePortfolioFilters
  , parseEquipment = helpers.parseEquipment;


  app.all('/', ensureAuthenticated, function(req, res){
    res.redirect('/ia');
  });

  app.all('/ia', ensureAuthenticated, function(req, res){

    var requestOptions = {
      method: 'GET',
      headers: {
        currentUser: req.user.email,
        access_token: req.user.access_token,
        clientSecret: app.get('clientSecret')
      }
    };

    var myTeams,
        portfolios,
        projects,
        equipment,
        everythingLoaded = Q.defer();

    var resolveEverythingLoaded = function(){
      if (portfolios && projects && equipment) {
        everythingLoaded.resolve();
      }
    };

    var user = (function(){
      var defer = Q.defer();

      request(_.extend({}, requestOptions, {
        uri: app.get('modelUrl') + '/res/user'
      }), function(error, response, body){
        var user;
        try {
          user = JSON.parse(body);
        }
        catch(e) {
          console.error('User JSON is malformed');
        }

        if (!user) {
          res.send(500);
          return false;
        }

        // Until we have a default team option for the user, assume first team or last selected. Or, you know. No team at all.
        var team = user.default_team ? user.default_team : user.teams[0] ? user.teams[0][0] : 'No Team'; // Hack.
        req.session.team_label = req.session.team_label || team;
        req.session.org_label = user.org_label;
        myTeams = user.teams;

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
          defer.resolve(user);
        }
      });

      return defer.promise;
    })();


    user.then( function(){
      request(_.extend({}, requestOptions, {
        uri: app.get('modelUrl') + '/res/teamportfolios',
        qs: {
          team_label: req.session.team_label,
          org_label: req.session.org_label
        }
      }), function(error, response, body){
        portfolios = parsePortfolioFilters(body);

        resolveEverythingLoaded();
      });
    });

    user.then( function(){
      request(_.extend({}, requestOptions, {
        uri: app.get('modelUrl') + '/res/teamprojects',
        qs: {
          team_label: req.session.team_label,
          org_label: req.session.org_label
        }
      }), function(error, response, body){
        // Portfolios returns as an array but projects returns as an array inside an object
        // (i.e. { projects: [] } )
        // sooooo, we have to do this to keep our stuff consistent
        projects = JSON.stringify(JSON.parse(body).projects || []);

        resolveEverythingLoaded();
      });
    });

    request(_.extend({}, requestOptions, {
      uri: app.get('equipUrl') + '/api/equipment'
    }), function(error, response, body){
      equipment = JSON.stringify(parseEquipment(body));

      resolveEverythingLoaded();
    });

    everythingLoaded.promise.then( function(obj){
      res.render('index', {
        user: JSON.stringify({
          name: req.user.name,
          email: req.user.email,
          teams: myTeams,
          currentTeam: req.session.team_label,
          currentOrganization: req.session.org_label,
          role: roles[req.user.role]
        }),
        portfolios: portfolios,
        projects: projects,
        equipment: equipment,
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
