var request = require('request');

module.exports = function(app){
  ///////
  // Data
  /////

  app.get('/api/discovery/:id?/ddls',
    function(req, res){
      request({
        method: 'GET',
        uri: app.get('dataUrl') + '/data/discovery/' + req.params.id + '/ddls-types',
        headers: {
          'accept-encoding' : 'gzip,deflate'
        }
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

  app.post('/api/heatmap/:type?/:deviceType?',
    function(req, res, next){
      console.log('heard heatmap');
      next();
    },
    function(req, res){
      request({
        method: 'POST',
        uri: app.get('dataUrl') + '/cubes/heatmap',
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

  app.post('/api/kpis',
    function(req, res){
      request({
        method: 'POST',
        uri: app.get('dataUrl') + '/kpi/mapper/performance_snapshot,energy_production',
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
