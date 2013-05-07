define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette'
], function(
  $,
  _,
  Backbone,
  Marionette
){
  var Device = { views: {} };

  Device.Model = Backbone.Model.extend({
    defaults: {
      type: 'device'
    }
  });

  Device.Collection = Backbone.Collection.extend({
    model: Device.Model
  });

  return Device;
});
