var request = require('request');

module.exports = function(app){
  ///////
  // Data
  /////

  app.get('/api/discovery/:id?/ddls',
    function(req, res){
      request({
        method: 'GET',
        uri: app.get('dataUrl') + '/api/discovery/' + req.params.id + '/ddls'
      }, function(err, response, body){
        res.end(body);
      });
    }
  );

  app.post('/api/timeline',
    function(req, res){
      request({
        method: 'POST',
        uri: app.get('dataUrl') + '/api/timeline',
        body: JSON.stringify(req.body),
        headers: {
          'Content-Type': 'application/json'
        }
      }, function(err, response, body){
        //console.log(response.headers);
        //console.log(body);
        res.end(body);
      });
    }
  );

  app.post('/api/snapshot',
    function(req, res){
      console.log(req.body);
      request({
        method: 'POST',
        uri: app.get('dataUrl') + '/api/snapshot',
        body: JSON.stringify(req.body),
        headers: {
          'Content-Type': 'application/json'
        }
      }, function(err, response, body){
        //console.log(response.headers);
        console.log(body);
        res.end(body);
      });
    }
  );
};
