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
  var Equip = { views: {} };

  Equip.Model = Backbone.Model.extend({
  });

  Equip.Collection = Backbone.Collection.extend({
    model: Equip.Model,
    url: '/api/equipment'
  });

  return Equip;
});
