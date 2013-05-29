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

    initialize: function(){
      this.outgoing = new Device.Collection();
      this.incoming = new Device.Collection();
    },

    hasChild: function(child){
      return this.outgoing.contains(child) ||
        this.outgoing.any(function(model){
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

  Device.views.Canvas = Canvas;

  return Device;
});
