/**
 * Module dependencies.
 */
var querystring = require('querystring')
  , util = require('util')
  , passport = require('passport')
  , url = require('url')
  , util = require('util')
  , http = require('http')
  , OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'http://127.0.0.1:8431/ia/oauth2/auth';
  options.tokenURL = options.tokenURL || 'http://127.0.0.1:8431/ia/oauth2/token';
  options.scopeSeparator = options.scopeSeparator || ',';
  
  OAuth2Strategy.call(this, options, verify);
  this.name = 'draker-ia6';

  var self = this; // so we can set `_results` on the strategy instance
  this._oauth2.getOAuthAccessToken = function(code, params, callback) {
    // This form preserves the params sent as arguments, so grant_type and
    // redirect_uri don't need to be re-specified.
    var params= params || {};
    params['client_id'] = this._clientId;
    params['client_secret'] = this._clientSecret;
    params['code']= code;

    var post_data = querystring.stringify( params );
    var post_headers = {
      'Content-Length': post_data.length,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept':'application/jsonrequest',
      'Cache-Control':'no-cache,no-store,must-revalidate'};

    this._request("POST", this._getAccessTokenUrl(), post_headers, post_data, null, function(error, data, response) {
      if( error ) {
        // console.log(error);
        callback(error);
      } else {
        var results;
        results = JSON.parse( data );
        self._results = results;
        var access_token = results["access_token"];
        callback(null, results["access_token"], results["refresh_token"]);
      }
    });
  }
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);


Strategy.prototype.userProfile = function(token, done) {
  done(null, this._results);
}

/**
 * Authenticate request by delegating to a service provider using OAuth 2.0.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req, options) {
  options = options || {};
  var self = this;

  if (req.query && req.query.error) {
    // TODO: Error information pertaining to OAuth 2.0 flows is encoded in the
    //       query parameters, and should be propagated to the application.
    return this.fail();
  }

  var callbackURL = options.callbackURL || this._callbackURL;
  if (callbackURL) {
    var parsed = url.parse(callbackURL);
    if (!parsed.protocol) {
      // The callback URL is relative, resolve a fully qualified URL from the
      // URL of the originating request.
      callbackURL = url.resolve(utils.originalURL(req), callbackURL);
    }
  }

  if (req.query && req.query.code) {
    var code = req.query.code;

    // NOTE: The module oauth (0.9.5), which is a dependency, automatically adds
    //       a 'type=web_server' parameter to the percent-encoded data sent in
    //       the body of the access token request.  This appears to be an
    //       artifact from an earlier draft of OAuth 2.0 (draft 22, as of the
    //       time of this writing).  This parameter is not necessary, but its
    //       presence does not appear to cause any issues.
    this._oauth2.getOAuthAccessToken(code, { grant_type: 'authorization_code', redirect_uri: callbackURL },
      function(err, accessToken, refreshToken, params) {
        if (err) { return self.error(new InternalOAuthError('failed to obtain access token', err)); }

        self._loadUserProfile(accessToken, function(err, profile) {
          if (err) { return self.error(err); };

          function verified(err, user, info) {
            if (err) { return self.error(err); }
            if (!user) { return self.fail(info); }
            self.success(user, info);
          }
          if (self._passReqToCallback) {
            var arity = self._verify.length;
            if (arity == 6) {
              self._verify(req, accessToken, refreshToken, params, profile, verified);
            } else { // arity == 5
              self._verify(req, accessToken, refreshToken, profile, verified);
            }
          } else {
            var arity = self._verify.length;
            if (arity == 5) {
              self._verify(accessToken, refreshToken, params, profile, verified);
            } else { // arity == 4
              self._verify(accessToken, refreshToken, profile, verified);
            }
          }
        });
      }
    );
  } else {
    // NOTE: The module oauth (0.9.5), which is a dependency, automatically adds
    //       a 'type=web_server' parameter to the query portion of the URL.
    //       This appears to be an artifact from an earlier draft of OAuth 2.0
    //       (draft 22, as of the time of this writing).  This parameter is not
    //       necessary, but its presence does not appear to cause any issues.

    var params = this.authorizationParams(options);
    params['response_type'] = 'code';
    params['redirect_uri'] = callbackURL;
    params['username'] = req.body.username;
    params['pw'] = req.body.password;
    var scope = options.scope || this._scope;
    if (scope) {
      if (Array.isArray(scope)) { scope = scope.join(this._scopeSeparator); }
      params.scope = scope;
    }
    var state = options.state;
    if (state) { params.state = state; }

    var location = this._oauth2.getAuthorizeUrl(params);
    this.redirect(location);
  }
}

Strategy.reset = function(req, res, app, callback) {
  var reset_params = {};
  reset_params['pw'] = req.body.password;
  reset_params['pw_new'] = req.body.password_new;
  reset_params['client_id'] = app.get('clientID');
  reset_params['client_secret'] = app.get('clientSecret');
  reset_params['access_token'] = req.user.access_token;
  var reset_post_data = querystring.stringify( reset_params );
  var reset_post_options = {
    host: '127.0.0.1',
    port: 8431,
    path: '/ia/oauth2/reset_params',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': reset_post_data.length,
      'Accept':'application/jsonrequest',
      'Cache-Control':'no-cache,no-store,must-revalidate'
    }
  };
  var post_req = http.request(reset_post_options, function(post_res) {
    post_res.setEncoding('utf8');
    post_res.on('end', function () {
      // console.log('Response:' + post_res.statusCode);
      callback( req, res, { status: post_res.statusCode } );
      });
  });
  post_req.on("error", function(e) {
    // console.log("Got error: " + e.message);
    callback( req, res, { status: 401, message: e.message } );
  });

  post_req.write(reset_post_data);
  post_req.end();
}

Strategy.logout = function(req, res, app, callback) {
  var logo_params = {};
  logo_params['client_id'] = app.get('clientID');
  logo_params['client_secret'] = app.get('clientSecret');
  logo_params['email'] = req.user.email;
  var logo_post_data = querystring.stringify( logo_params );
  var logo_post_options = {
    host: '127.0.0.1',
    port: 8431,
    path: '/ia/oauth2/logout',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': logo_post_data.length,
      'Accept':'application/jsonrequest',
      'Cache-Control':'no-cache,no-store,must-revalidate'
    }
  };
  var post_req = http.request(logo_post_options, function(post_res) {
    post_res.setEncoding('utf8');
    post_res.on('end', function () {
      // console.log('Logout Response:' + post_res.statusCode);
      callback( req, res, { status: post_res.statusCode } );
      });
  });
  post_req.on("error", function(e) {
    // console.log("Got error: " + e.message);
    callback( req, res, { status: 500, message: e.message } );
  });

  post_req.write(logo_post_data);
  post_req.end();
}

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
