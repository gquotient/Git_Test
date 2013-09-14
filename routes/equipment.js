var _ = require('lodash'),
  request = require('request');

module.exports = function(app){

  var helpers = require('./helpers')(app),
    ensureAuthorized = helpers.ensureAuthorized,
    parseEquipment = helpers.parseEquipment;

  //////
  // EQUIPMENT
  //////

  app.get('/api/equipment',
    helpers.request({
      host: app.get('equipUrl'),
      path: '/api/equipment',
      middleware: true
    }),
    function(req, res){
      res.send(res.statusCode, parseEquipment(res.body));
    });

  app.get('/api/equipment/:label',
    helpers.request({
      host: app.get('equipUrl'),
      path: function(req){
        return '/api/equipment/' + req.params.label.replace(/_(v\d+)$/, '/$1');
      },
      middleware: true
    }),
    function(req, res){
      var equipment = parseEquipment(res.body);

      // Only return the newest version.
      equipment = _.reduce(equipment, function(memo, equip){
        return equip.equipment_label > memo.equipment_label ? equip : memo;
      });

      res.send(res.statusCode, equipment);
    });

  app.post('/api/equipment', ensureAuthorized(['vendor_admin']),
    function(req, res, next){
      var label = req.body.label,
        extends_from = req.body.extends_from,
        match = /([^:]+)_v(\d+)$/.exec(extends_from);

      if (!label) {
        res.send(301, {message: 'An equipment label is required'});
        return;
      }

      // If the label exists then just increment the version.
      if (match && match[1] === label) {
        label = extends_from.replace(/\d+$/, parseInt(match[2], 10) + 1);

      // Otherwise append the default version and prepend the extended
      // equipment label if not empty.
      } else {
        label += '_v1';

        if (extends_from) {
          label = extends_from + ':' + label;
        }
      }

      req.body.equipment_label = req.params.label = label;
      req.body = {data: JSON.stringify(req.body)};

      next();
    },
    helpers.request({
      host: app.get('equipUrl'),
      path: function(req){
        return '/api/equipment/' + req.params.label.replace(/_(v\d+)$/, '/$1');
      },
      middleware: true
    }),
    function(req, res){
      var stat = res.statusCode;

      res.send(stat, stat === 200 ? req.body.data : res.body);
    });

  app.put('/api/equipment/:label', ensureAuthorized(['vendor_admin']),
    function(req, res, next){
      req.body = {data: JSON.stringify(req.body)};

      next();
    },
    helpers.request({
      host: app.get('equipUrl'),
      path: function(req){
        return '/api/equipment/' + req.params.label.replace(/_(v\d+)$/, '/$1');
      },
      middleware: true
    }),
    function(req, res){
      var stat = res.statusCode;

      res.send(stat, stat === 200 ? req.body.data : res.body);
    });

  app.del('/api/equipment/:label', ensureAuthorized(['vendor_admin']),
    helpers.request({
      host: app.get('equipUrl'),
      path: function(req){
        return '/api/equipment/' + req.params.label.replace(/_(v\d+)$/, '/$1');
      }
    }));
};
