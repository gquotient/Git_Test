var request = require('request');

module.exports = function(app){
  ///////
  // Data
  /////

  app.get('/api/discovery/:id?/ddls',
    function(req, res){
      request({
        method: 'GET',
        uri: app.get('dataUrl') + '/data/discovery/' + req.params.id + '/ddls',
        headers: {
          'accept-encoding' : 'gzip,deflate'
        }
      }, function(error, response){
        console.log(response.headers);
      })
      .pipe(res);
    }
  );

  app.post('/api/timeline',
    function(req, res){
      request({
        method: 'POST',
        uri: app.get('dataUrl') + '/data/timeline',
        body: JSON.stringify(req.body),
        headers: {
          'Content-Type': 'application/json',
          'accept-encoding' : 'gzip,deflate'
        }
      })
      .pipe(res);
    }
  );

  app.post('/api/snapshot',
    function(req, res){
      request({
        method: 'POST',
        uri: app.get('dataUrl') + '/data/snapshot',
        body: JSON.stringify(req.body),
        headers: {
          'Content-Type': 'application/json',
          'accept-encoding' : 'gzip,deflate'
        }
      })
      .pipe(res);
    }
  );
};
