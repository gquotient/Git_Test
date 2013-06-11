var fs = require('fs');

module.exports = function(app){
    ///////
  // Alarms
  /////

  app.get('/api/issues',
    function(req, res){
      fs.readFile('./data/json/issues.json', 'utf8', function (err, data) {
        if (err) {
          return console.log(err);
        }
        res.end(data);
      });
    });

  ///////
  // Alarms
  /////

  app.get('/api/issues',
    function(req, res){
      fs.readFile('./data/json/issues.json', 'utf8', function (err, data) {
        if (err) {
          return console.log(err);
        }
        res.end(data);
      });
    });
};
