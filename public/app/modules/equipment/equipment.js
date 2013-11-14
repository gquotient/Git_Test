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
    DAQ: ['MANAGES', 'HAS'],
    ZONE: ['USES', 'ENCOMPASS']
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
      'inherits',
      'label',
      'name',
      'schema'
    ],

    initialize: function(){
      this.relationships = {};

      this.outgoing = new Equip.Collection();
      this.incoming = new Equip.Collection();

      if (!this.has('inherits')) {
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

    // Internal function for calling methods on the equipment inheritence chain.
    _invokeOnInherits: function(name){
      var inherits = this.collection.get(this.attributes.inherits),
        func = inherits && inherits[name];

      return _.isFunction(func) ? func.apply(inherits, _.tail(arguments)) : null;
    },

    has: function(attr, options){
      options = options || {};

      // Check local attributes first.
      if (_.has(this.attributes, attr)) { return true; }

      // Don't go any further if we are only checking local attributes.
      if (options.local || _.contains(this.localAttributes, attr)) {
        return false;
      }

      // Otherwise check the inheritence chain.
      return this._invokeOnInherits('has', attr, options);
    },

    get: function(attr, options){
      options = options || {};

      // Check local attributes first.
      if (_.has(this.attributes, attr)) { return this.attributes[attr]; }

      // Don't go any further if we are only checking local attributes.
      if (options.local || _.contains(this.localAttributes, attr)) { return null; }

      // Otherwise check the inheritence chain.
      return this._invokeOnInherits('get', attr, options);
    },

    getAttributes: function(){
      return _.chain(this._invokeOnInherits('getAttributes') || {})
        .omit(this.localAttributes)
        .extend(this.attributes)
        .value();
    },

    getSchema: function(){
      var inherited = this._invokeOnInherits('getSchema') || this.constructor.schema,
        schema = this.get('schema') || {};

      // Combine inherited and instance schema.
      return _.reduce(inherited, function(memo, params, attr){
        memo[attr] = _.extend({}, params, schema[attr]);
        return memo;
      }, {});
    },

    getBase: function(){
      // Go up the chain of inheritence.
      return this._invokeOnInherits('getBase') || this;
    },

    getDerivatives: function(){
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

    getRendering: function(label){
      return _.findWhere(this.get('renderings'), {label: label});
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

      return base && base.get('name');
    },

    factory: function(project){
      var label = this.getRootLabel(),
        index = findNextIndex(label, project.devices.pluck('did')),

        device = new Device.Model({
          equipment_label: this.id,
          project_label: project.get('project_label'),
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
      var rendering = this.getRendering(label),
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
      // Generic
      label: {
        required: true,
        editable: false,
        validate: function(value){
          // Labels must start with a letter followed by letters and numbers
          // and be between 3 and 10 characters long.
          return (/^[A-Z][A-Z0-9]{2,9}$/).test(value);
        }
      },
      inherits: {
        required: true,
        editable: false
      },
      manufacturer: {
        required: true
      },
      model: {
        required: true
      },
      name: {
        required: true
      },
      ddl: {
        editable: false,
        source: []
      },
      interface_module: {
        source: []
      },

      // Panel
      nominal_power: {
        type: 'power',
        units: 'watts'
      },
      frame_length: {
        type: 'length',
        units: 'meters'
      },
      frame_width: {
        type: 'length',
        units: 'meters'
      },
      frame_thickness: {
        type: 'length',
        units: 'meters'
      },
      cell_count: {
        type: 'integer'
      },
      diode_count: {
        type: 'integer'
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
