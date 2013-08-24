var _ = require('lodash')
  , request = require('request');

module.exports = function(app){
  return {
    ensureAuthenticated: function (req, res, next) {
      if (req.isAuthenticated()) { return next(); }

      if (req.url.split('/')[1] === 'api') {
        res.send(401, 'Not Authorized');
      } else {
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
      req.body.org_label = req.query.org_label;
      next();
    },
    ensureCurrentTeam: function(req, res, next){
      req.query.team_label = req.body.team_label || req.query.team_label || req.params.team_label || req.session.team_label;
      req.body.team_label = req.query.team_label;
      next();
    },
    separateProperties: function(root, ignore){
      return function(req, res, next){
        req.body = _.reduce(req.body, function(memo, value, key){
          if (_.contains(root, key)) {
            memo[key] = value;

          } else if (!_.contains(ignore, key)) {
            if (_.isPlainObject(value)) {
              value = JSON.stringify(value);
            }

            memo.properties[key] = value;
          }
          return memo;
        }, {properties: {}});

        req.body.properties = JSON.stringify(req.body.properties);

        next(req, res);
      };
    },
    parsePortfolioFilters: function(portfolios){
      // Parse json
      portfolios = JSON.parse(portfolios);

      var parseFilters = function(filter){
        // Only parse if the filter is an array (smart filter)
        if (typeof filter === 'string' && filter.charAt(0) === '[') {
          filter = JSON.parse(filter);
        }

        return filter;
      };

      // Since the body can come back as an array or a single object,
      // handle each case
      if (_.isArray(portfolios)) {
        _.each(portfolios, function(portfolio){
          portfolio.filter = parseFilters(portfolio.filter);
        });
      } else if (_.isObject(portfolios)) {
        portfolios.filter = parseFilters(portfolios.filter);
      }

      // Re-stringify to send back to the browser
      portfolios = JSON.stringify(portfolios);

      return portfolios;
    },
    makeRequest: function(options){
      var _request = function(req, res, next){

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
          var stat = response.statusCode;

          if (error) {
            req.flash('error', error.message);
            console.log('error!:', error);
            res.redirect('/ia');
          }

          if (stat < 200 || stat > 299) {
            console.log('error!:', stat, body);

            if (options.error) {
              options.error(body, stat, res);
            } else {
              res.send(stat);
            }

          } else if (options.success) {
            options.success(body, stat, res);

          } else if (options.translate) {
            options.translate(JSON.parse(body), function(translatedData){
              res.send(JSON.stringify(translatedData));
            });

          } else if (options.processData) {
            // Manipulate the response after the request returns
            res.body = body;
            next();
          } else {
            res.end(body);
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
