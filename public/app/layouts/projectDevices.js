define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'project',
  'device',

  'hbs!layouts/templates/projectDevices'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  Project,
  Device,

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

      this.model = options.model;

      this.devices = new Device.Model();

      this.model.fetch({data: {project_label: this.model.get('label')}}).done(function(){
        console.log('devices done', arguments, this);
      });
    }
  });
});
