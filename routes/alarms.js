var request = require('request');

module.exports = function(app){
    ///////
  // Alarms
  /////

  app.get('/api/alarms/active/:projectId?',
    function(req, res){
      request({
        method: 'GET',
        uri: app.get('dataUrl') + '/alarms/active/' + req.params.projectId,
        headers: {
          'accept-encoding' : 'gzip,deflate'
        }
      }).pipe(res);
    }
  );
};
