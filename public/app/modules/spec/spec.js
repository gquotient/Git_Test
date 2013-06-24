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
  var Spec = { views: {} };

  Spec.Model = Backbone.Model.extend({
  });

  Spec.Collection = Backbone.Collection.extend({
    model: Spec.Model,
    url: '/api/specs'
  });

  return Spec;
});
