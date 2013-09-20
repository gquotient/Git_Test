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

      if (!this.has('extends_from')) {
        _.each(this.get('relationships'), function(rel){
          var other = this.collection.findWhere({label: rel.target});

          if (other) {
            if (rel.direction === 'INCOMING') {
              this.connectTo(other, rel.label);
            } else {
              other.connectTo(this, rel.label);
            }
          }
        }, this);
      }
    },

    get: function(attr){
      var extension;

      // If the attr exists locally return it.
      if (_.has(this.attributes, attr)) {
        return this.attributes[attr];

      // Otherwise if this isn't exclusivly local then try and find it.
      } else if (!_.contains(this.localAttributes, attr)) {
        extension = this.collection.get(this.get('extends_from'));
        return extension && extension.get(attr);
      }
    },

    getBase: function(){
      var extension = this.collection.get(this.get('extends_from'));

      return extension ? extension.getBase() : this;
    },

    getExtends: function(){
      return this.collection.filter(function(model){
        return model !== this && model.id.indexOf(this.id) >= 0;
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
      var base = this.getBase(),
        label;

      if (base !== this) {
        return base && base.getRelationship(target, rendering);
      }

      if (target instanceof Equip.Model) {
        label = this.relationships[target.getBase().cid];

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
      var base = this.getBase();

      return base && base.get('label');
    },

    getBaseName: function(){
      var base = this.getBase();

      return base && base.get('display_name');
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
      var name = this.get('display_name'), did;

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
  }, {
    schema: {
      label: {
        type: 'text',
        required: true,
        editable: false,
        validate: function(value){
          return (/^[A-Z0-9]+$/).test(value);
        }
      },
      extends_from: {
        type: 'text',
        required: true,
        editable: false,
        validate: function(value){
          return value && value !== '';
        }
      },
      display_name: {
        type: 'text',
        required: true,
        validate: function(value){
          return value && value !== '';
        }
      }
    }
  });

  Equip.Collection = Backbone.Collection.extend({
    model: Equip.Model,
    url: '/api/equipment',

    getEquipment: function(label){
      return this.get(label) || this.findWhere({label: label});
    },

    getForDevice: function(device){
      var label = device.get('equipment_label'),
        equip = label && this.getEquipment(label),
        match;

      // If equipment_label doesn't exist try to find the base equip.
      if (!equip && label) {
        match = /^([A-Z]+)_/.exec(label);
        equip = match && this.getEquipment(match[1]);
      }

      // Otherwise try and use the device did to find the base equip.
      if (!equip && device.has('did')) {
        match = /^([A-Z]+)-/.exec(device.get('did'));
        equip = match && this.getEquipment(match[1]);
      }

      // As a last resort create the equipment.
      if (!equip) {
        equip = this.push({equipment_label: label});
      }

      return equip;
    }
  });

  _.extend(Equip.views, adminViews);

  return Equip;
});
