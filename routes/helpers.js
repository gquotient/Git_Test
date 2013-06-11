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
          opts.form = _.extend({}, req.body);
        }

        request(opts, function(error, response, body){
          if (error) {
            req.flash('error', error.message);
            console.log('error!:', error);
            res.redirect('/ia');
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
