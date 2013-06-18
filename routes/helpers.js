var _ = require('lodash')
  , request = require('request');

module.exports = function(app){
  return {
    ensureAuthenticated: function (req, res, next) {
      if (req.isAuthenticated()) { return next(); }
      else {
        if(req.url !== '/reset' || req.url !== '/login') { req.session.redirectUrl = req.url; }
        res.redirect('/login');
      }
    },
    ensureAuthorized: function (roles){
      return function(req, res, next) {
        if ( _.contains(roles, req.user.role) ){
          next();
        } else {
          req.flash('error', 'Unauthorized');
          res.redirect('/ia');
        }
      };
    },
    ensureCurrentUser: function (req, res, next) {
      if(req.user.user_id === req.body.user_id) {
        next();
      } else {
        req.flash('error', 'Unauthorized');
        res.redirect('/ia');
      }
    },
    ensureCurrentOrganization: function(req, res, next){
      req.query.org_label = req.body.org_label || req.query.org_label || req.params.org_label || req.session.org_label;
      next();
    },
    ensureCurrentTeam: function(req, res, next){
      req.query.team_label = req.body.team_label || req.query.team_label || req.params.team_label || req.session.team_label;
      next();
    },
    separateProperties: function(root, ignore){
      return function(req, res, next){
        req.body = _.reduce(req.body, function(memo, value, key){
          if (_.contains(root, key)) {
            memo[key] = value;
          } else if (!_.contains(ignore, key)) {
            memo.properties[key] = value;
          }
          return memo;
        }, {properties: {}});

        req.body.properties = JSON.stringify(req.body.properties);

        next(req, res);
      };
    },
    makeRequest: function(options){
      var _request = function(req, res){

        var opts = _.extend({
          method: req.method,
          host: app.get('modelUrl'),
          path: '',
          headers: {
            currentUser: req.user.email,
            access_token: req.user.access_token,
            clientSecret: app.get('clientSecret')
          }
        }, options);

        opts.uri = opts.host + opts.path;

        if (req.query) {
          opts.qs = _.extend({}, req.query);
        }

        if (req.body) {
          if (req.method === 'DELETE') {
            opts.qs = _.extend({}, opts.qs, req.body);
          } else {
            opts.form = _.extend({}, req.body);
          }
        }

        request(opts, function(error, response, body){
          if (error) {
            req.flash('error', error.message);
            console.log('error!:', error);
            res.redirect('/ia');
          } else if (response.statusCode !== 200) {
            console.log('error!:', response.statusCode, body);
            res.send(response.statusCode);
          } else {
            console.log(body);

            if (opts.translate) {
              opts.translate(JSON.parse(body), function(translatedData){
                res.end(JSON.stringify(translatedData));
              });
            } else {
              res.end(body);
            }
          }
        });
      };

      if (options.setup) {
        return function(req, res){
          options.setup(req, res, _request);
        };

      } else {
        return _request;
      }
    }
  };
};
