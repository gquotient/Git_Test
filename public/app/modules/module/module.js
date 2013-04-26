define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette'
],
function(
  $,
  _,
  Backbone,
  Marionette
){
  var Module = { views: {} };

  Module.model = Backbone.Model.extend({});

  Module.views.floating = Marionette.itemView.extend({});
});