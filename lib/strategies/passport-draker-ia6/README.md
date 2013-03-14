<h1>passport-draker-ia6</h1>

This is a Strategy for use with http://passportjs.org with the Draker IA6 IntelligentArray platform. It properly resolves a previous issue with handling the incoming OAuth information so that things like the instance_url can be readily available.

You'll need to require it:

```
var passport = require('passport')
  , DrakerIA6ComStrategy = require('passport-draker-ia6').Strategy
 ```


 Define the strategy with your application credentials and information:

 ```
 passport.use(new DrakerIA6Strategy({
    clientID: '{clientID}',
    clientSecret: '{clientSecret}',
    callbackURL: '{callbackUrl}'
  },
  function(token, tokenSecret, profile, done) {
    console.log(profile);
    return done(null, profile);
  }
));
```

And then setup some routes to hande the flow:
```
app.get('/login', passport.authenticate('draker-ia6'));
app.get('/token', 
  passport.authenticate('draker-ia6', { failureRedirect: '/error' }),
  function(req, res){
    res.render("index",checkSession(req));
  });
  ```

And as usual with passport, you can update the user serialization/de-serialization.