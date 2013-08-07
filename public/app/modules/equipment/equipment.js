define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'device'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Device
){
  var Equip = { views: {} };

  Equip.renderings = {
    POWER: ['FLOWS', 'COLLECTS', 'MEASURED_BY'],
    DAQ: ['MANAGES', 'HAS']
  };


  function findNextIndex(label, existing){
    var index = 1;

    _.each(existing, function(did){
      var parts = did && did.split('-'), num;

      if (parts[0] === label) {
        num = parseInt(parts[1], 10);

        if (num && num >= index) {
          index = num + 1;
        }
      }
    });

    return index;
  }

  function adjustPosition(label, position, project){

    function overlaps(other){
      var pos = other.getPosition(label);

      return pos && pos.x === position.x && pos.y === position.y;
    }

    if (position) {
      while (project.devices.any(overlaps)) {
        position.y += 100;
      }
    }

    return position;
  }


  Equip.Model = Backbone.Model.extend({
    idAttribute: 'label',

    initialize: function(){
      this.relationships = {};

      this.outgoing = new Equip.Collection();
      this.incoming = new Equip.Collection();

      _.each(this.get('relationships'), function(rel){
        var other = this.collection.get(rel.target);

        if (other) {
          if (rel.direction === 'INCOMING') {
            this.connectTo(other, rel.label);
          } else {
            other.connectTo(this, rel.label);
          }
        }
      }, this);
    },

    connectTo: function(target, rel){
      if (!_.has(this.relationships, target.cid)) {
        this.relationships[target.cid] = rel;

        this.incoming.add(target);
        target.outgoing.add(this);
      }
    },

    getRelationship: function(target, rendering){
      var label;

      if (_.has(this.relationships, target.cid)) {
        label = this.relationships[target.cid];
      } else if (target.has('did')) {
        label = (_.findWhere(this.get('relationships'), {
          target: target.get('did').replace(/-\d*$/, ''),
          direction: 'INCOMING'
        }) || {}).label;
      }

      if (rendering && !_.contains(Equip.renderings[rendering], label)) {
        label = null;
      }

      return label;
    },

    hasRendering: function(label){
      return _.any(this.get('renderings'), function(rendering){
        return rendering.label === label;
      });
    },

    isRoot: function(label){
      return _.any(this.get('renderings'), function(rendering){
        return (!label || rendering.label === label) && rendering.root;
      });
    },

    getRootLabel: function(){
      return this.get('label');
    },

    factory: function(project){
      var label = this.getRootLabel(),
        index = findNextIndex(label, project.devices.pluck('did')),

        device = new Device.Model({
          equipment_label: this.id,
          project_label: project.id,
          did: label + '-' + index,
          name: this.get('name') + ' ' + index
        });

      device.equipment = this;

      return device;
    },

    addRendering: function(device, project, label, target){
      var rendering = _.findWhere(this.get('renderings'), {label: label}),
        position;

      if (!rendering || device.getPosition(label)) { return; }

      // Check if this is a root device.
      if (rendering.root && rendering.position) {
        position = _.clone(rendering.position);

        // Move device to the bottom.
        project.devices.each(function(other){
          var pos = other.getPosition(label);

          if (pos && pos.y >= position.y) {
            position.y = pos.y + 200;
          }
        });

      // Otherwise position relative to target device.
      } else if (target && this.getRelationship(target, label)) {
        position = target.getPosition(label);

        // Apply offset for this equipment.
        if (position && rendering.offset) {
          position.x += rendering.offset.x || 0;
          position.y += rendering.offset.y || 0;
        }
      }

      // If position was found adjust for overlap and set.
      if (position) {
        adjustPosition(label, position, project);
        device.setPosition(label, position);
      }
    }
  });

  Equip.Collection = Backbone.Collection.extend({
    model: Equip.Model,
    url: '/api/equipment',

    findOrCreateForDevice: function(device){
      var label = device.get('equipment_label');

      if (!label) {
        label = device.get('did').replace(/-\d*$/, '');
      }

      return this.get(label) || this.push({label: label});
    }
  });

  return Equip;
});
