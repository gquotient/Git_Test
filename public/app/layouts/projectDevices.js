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
      this.contentNavigation.show(this.navView);
    },

    initialize: function(options){
      console.log('initialize project devices', options, this);
      var that = this;

      this.model = options.model;

      this.navView = new Device.views.NavigationListView({collection: new Device.Collection()});

      this.model.fetch({data: {project_label: this.model.get('label')}}).done(function(){
        console.log('devices done');
        console.log(arguments, that.model);

        that.navView.collection.reset(that.model.devices.where({devtype: 'Inverter'}));
      });
    }
  });
});
