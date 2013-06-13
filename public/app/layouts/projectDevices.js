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
      this.contentNavigation.show(this.devicesTree);
    },

    events: {
      'click .device a': function(event){
        event.preventDefault();
        console.log(event, this);
      }
    },

    initialize: function(options){
      var that = this;

      // Set the project model to this layout's model
      this.model = options.model;

      // Instantiate devices collection view
      this.devicesTree = new Device.views.NavigationList({collection: new Device.Collection()});

      // Fetch project to get devices
      this.model.fetch({data: {project_label: this.model.get('label')}}).done(function(){
        // Update collection once data is retrieved
        that.navView.collection.reset(that.model.devices.where({devtype: 'Inverter'}));
      });
    }
  });
});
