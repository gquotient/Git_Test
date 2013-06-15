var request = require('request');

module.exports = function(app){
  ///////
  // Data
  /////

  app.post('/api/timeline',
    function(req, res){
      request({
        method: 'POST',
        uri: app.get('dataUrl') + '/api/timeline?timezone=' + req.query.timezone,
        body: JSON.stringify(req.body),
        headers: {
          'Content-Type': 'application/json'
        }
      }, function(err, response, body){
        console.log(body);
        res.end(body);
      });
    }
  );
};
