define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  './canvas'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Canvas
){

  var Device = { views: {} };

  Device.Model = Backbone.Model.extend({
    url: '/api/devices',
    defaults: {
      type: 'device'
    },

    initialize: function(){
      this.devices = new Device.Collection();
    },

    moveTo: function(other){
      if (this.parent) {
        this.parent.devices.remove(this);
      }

      this.parent = other;
      this.parent.devices.add(this);
    },

    hasChild: function(child){
      return this.devices.contains(child) ||
        this.devices.any(function(model){
          return model.hasChild(child);
        });
    }
  });

  Device.Collection = Backbone.Collection.extend({
    model: Device.Model,

    filterByType: function(type, first){
      if (!_.isArray(type)) {
        return this.where({device_type: type}, first);
      } else {
        return this[first ? 'find' : 'filter'](function(model){
          return _.contains(type, model.get('device_type'));
        });
      }
    },

    next: function(model){
      var index = this.indexOf(model);
      return (index !== -1 && this.at(index + 1)) || this.first();
    },

    previous: function(model){
      var index = this.indexOf(model);
      return this.at(index - 1) || this.last();
    }
  });

  Device.LibraryModel = Backbone.Model.extend({

    createDevice: function(project, parnt){
      var index = this.nextIndex(project, 1),
        parent_id = parnt.get('id'),

        rel = _.findWhere(this.get('relationships'), {
          direction: 'INCOMING',
          device_type: parnt.get('device_type')
        }, this),

        position = {
          x: parnt.get('positionX') || 700,
          y: parnt.get('positionY') || 200
        };

      if (!parent_id) { return null; }

      if (!rel || !rel.device_type || !rel.relationship_label) {
        rel = {relationship_label: 'COMPRISES'};
      }

      position = this.adjustPosition(project, position);

      return new Device.Model({
        name: this.get('name') + ' ' + index,
        did: this.get('prefix') + '-' + index,
        device_type: this.get('device_type'),

        project_label: project.get('label'),
        parent_id: parent_id,
        relationship_label: rel.relationship_label,

        positionX: position.x,
        positionY: position.y
      });
    },

    nextIndex: function(project, index){
      var num, type = this.get('device_type');

      project.allDevices.each(function(model){
        if (model.get('device_type') === type) {
          num = parseInt(model.get('did').replace(/^.*-/, ''), 10);
          if (num && num >= index) { index = num + 1; }
        }
      });

      return index;
    },

    adjustPosition: function(project, position){
      var type = this.get('device_type'),
        offset = this.get('positionOffset');

      if (this.get('root')) {
        project.allDevices.each(function(model){
          if (model.get('device_type') === type && model.get('positionY') >= position.y) {
            position.x = model.get('positionX');
            position.y = model.get('positionY') + 200;
          }
        });
      } else if (offset) {
        position.x += offset.x;
        position.y += offset.y;
      }

      while (project.allDevices.findWhere({positionX: position.x, positionY: position.y})) {
        position.y += 200;
      }

      return position;
    }
  });

  Device.LibraryCollection = Backbone.Collection.extend({
    model: Device.LibraryModel,

    filterByType: Device.Collection.prototype.filterByType,

    mapRelationshipTypes: function(types, props){
      return _.intersection.apply(this, _.map(this.filterByType(types), function(model){
        var relationships = model.get('relationships');

        if (props) { relationships = _.where(relationships, props); }

        return _.pluck(relationships, 'device_type');
      }));
    }
  });

  Device.views.Canvas = Canvas;

  return Device;
});
