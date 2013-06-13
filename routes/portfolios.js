module.exports = function(app){

  var helpers = require('./helpers')(app)
    , makeRequest = helpers.makeRequest;


  app.get('/api/portfolios',
  makeRequest({
    path: '/res/portfolios'
  }));

app.get('/api/portfolios/:team_label',
  makeRequest({
    path: '/res/portfolios'
  }));

};
