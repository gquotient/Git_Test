define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',

  'hbs!layouts/admin/templates/base'
], function(
  _,
  $,
  Backbone,
  Marionette,

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
