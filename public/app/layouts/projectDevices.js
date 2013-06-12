define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'project',

  'hbs!layouts/templates/projectDevices'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  Project,

  projectDevicesTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: projectDevicesTemplate
    },

    attributes: {
      id: 'page-projectDevices'
    },

    regions: {
      contentNavigation: '.nav_content'
    },

    selectDevice: function(id){
      console.log('select device', arguments);
    },

    onShow: function(){

    },

    initialize: function(options){
      console.log('initialize project devices', options, this);
    }
  });
});
