var request = require('request');

module.exports = function(app){
    ///////
  // Alarms
  /////

  app.get('/api/alarms/active/:id?',
    function(req, res){
      request({
        method: 'GET',
        uri: app.get('dataUrl') + '/alarms/active/' + req.params.id
      }, function(err, response, body){
        console.log('alarms', body.alarms);
        res.end(body.alarms);
      });
    }
  );
};
