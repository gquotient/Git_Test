define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'project',
  'device',
  'chart',

  'layouts/devices/core',

  'hbs!layouts/templates/devices'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  Project,
  Device,
  Chart,

  CoreLayout,

  devicesTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: devicesTemplate
    },

    attributes: {
      id: 'page-projectDevices'
    },

    regions: {
      contentNavigation: '.nav_content',
      deviceDetail: '.deviceDetail'
    },

    selectDevice: function(device){
      Backbone.history.navigate('/project/' + this.model.id + '/devices/' + device.get('graph_key'));

      this.deviceDetail.show(new CoreLayout({model: device, project: this.model}));

      $('.nav_content').find('.active').removeClass('active');

      // This is a nightmare - we need to come up with something less hacky
      $('.nav_content').find('#' + device.get('graph_key').replace(':', '\\:')).addClass('active');
    },

    onShow: function(){
      this.contentNavigation.show(this.devicesTree);
    },

    onClose: function(){
      if(this.model.devices && this.model.devices.length){
        // Clear devices from memory
        this.model.devices.reset();
      }
    },

    initialize: function(options){
      var that = this;

      Backbone.trigger('set:breadcrumbs', {state:'device', display_name:'Devices'});

      // Set the project model to this layout's model
      this.model = options.model;

      // Instantiate devices collection view
      this.devicesTree = new Device.views.NavigationList({collection: new Device.Collection()});

      // Fetch project to get devices
      this.model.fetch().done(function(){
        // Update collection once data is retrieved
        that.devicesTree.collection.reset(that.model.devices.where({devtype: 'Inverter'}));

        // If router passes a device, build detail view
        if (options.currentDevice) {
          var myDevice = that.model.devices.findWhere({graph_key: options.currentDevice});
          that.selectDevice(myDevice);
        }
      });

      // Listen for a device to be clicked and change view
      this.listenTo(Backbone, 'click:device', function(device){
        that.selectDevice(device);
      });
    }
  });
});
