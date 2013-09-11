define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'device',

  './admin'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Device,

  adminViews
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
    idAttribute: 'equipment_label',

    localAttributes: [
      'equipment_label',
      'extends_from',
      'label'
    ],

    initialize: function(){
      this.relationships = {};

      this.outgoing = new Equip.Collection();
      this.incoming = new Equip.Collection();

      if (this.isExtension()) {
        this.extension = this.collection.get(this.get('extends_from'));
      }

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

    isExtension: function(){
      return this.id && this.id.indexOf(':') !== -1;
    },

    get: function(attr){
      // If the attr exists locally return it.
      if (_.has(this.attributes, attr)) {
        return this.attributes[attr];

      // Otherwise if this is an extension and the attr is not exclusivly local
      // then try and find it up the chain.
      } else if (this.extension && !_.contains(this.localAttributes, attr)) {
        return this.extension.get(attr);
      }
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
          name: this.generateName(index)
        });

      device.equipment = this;

      return device;
    },

    generateName: function(index){
      var name = this.get('name'), did;

      if (index instanceof Backbone.Model) {
        did = index.get('did');
        index = did && parseInt(did.replace(/^.*-/, ''), 10);
      }

      return name && index ? name + ' ' + index : did || 'undefined';
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

    getBase: function(label){
      if (!_.isString(label)) { return; }

      label = label.split(':')[0];

      if (label.length && label.indexOf('_') === -1) {
        label += '_v1';
      }

      return this.get(label);
    },

    getEquipment: function(label, options){
      var model = this.get(label);

      options = options || {};

      if (!model || options.base) {
        model = this.getBase(label);
      }

      return model;
    },

    getForDevice: function(device){
      var label = device.get('equipment_label');

      if (!label && device.has('did')) {
        label = device.get('did').replace(/-\d*$/, '');
      }

      if (label) {
        return this.getEquipment(label);
      }
    }
  });

  _.extend(Equip.views, adminViews);

  return Equip;
});
