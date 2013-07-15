define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'hbs!layouts/adminLayouts/templates/base'
], function(
  _,
  $,
  Backbone,
  Marionette,
  Handlebars,

  baseTemplate
){

  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: baseTemplate
    },
    regions: {
      pageContent: '.pageContent'
    }
  });

});
