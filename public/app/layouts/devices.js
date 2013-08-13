define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'project',
  'device',
  'chart',
  'dateselection',

  'layouts/devices/core',
  'layouts/devices/inverter',

  'hbs!layouts/templates/devices',


], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  Project,
  Device,
  Chart,
  DateSelection,

  CoreLayout,
  InverterLayout,

  devicesTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: devicesTemplate
    },

    attributes: {
      id: 'page-devices'
    },

    regions: {
      contentNavigation: '.nav_content',
      deviceDetail: '.deviceDetail'
    },

    deviceLayouts: {
      core: CoreLayout,
      Inverter: InverterLayout
    },

    selectDevice: function(device){
      Backbone.history.navigate('/project/' + this.model.id + '/devices/' + device.get('graph_key'));

      // Build device specific detail layout
      var SubLayout = (this.deviceLayouts[device.get('devtype')]) ? this.deviceLayouts[device.get('devtype')] : this.deviceLayouts.core;

      // Show layout
      this.deviceDetail.show(new SubLayout({model: device, project: this.model}));

      // Set active nav el
      //NOTE - this is a special recursive method on the device tree
      this.devicesTree.propagateActive({graph_key: device.get('graph_key')});
    },

    buildSettingsDropdown: function(){
      var that = this;

      var myDateSelector = new DateSelection.views.Multi();

      /*
      var settingsDropdown = new Marionette.ItemView({
        tagName: 'li',
        template: _.template('<div class="dateSelection"></div>')
      });
      console.log(settingsDropdown.$('.dateSelection'));
      */


      //Create settings view
      this.options.settingsRegion.show(myDateSelector);
    },

    onShow: function(){
      var that = this;

      var initialView = function(){
        that.contentNavigation.show(that.devicesTree);

        that.devices.reset(that.model.devices.where({devtype: 'Inverter'}));
        // If router passes a device, build detail view
        if (that.options.currentDevice) {
          var myDevice = that.model.devices.findWhere({graph_key: that.options.currentDevice});
          that.selectDevice(myDevice);
        }
      };

      if (!this.model.devices.length) {
        // Fetch project to get devices
        this.model.fetch().done(function(){
          initialView();
        });
      } else {
        initialView();
      }

      this.buildSettingsDropdown();
    },

    initialize: function(options){
      var that = this;

      Backbone.trigger('set:breadcrumbs', {state:'device', display_name:'Devices'});

      // Instantiate devices collection view
      this.devices = new Device.Collection();
      this.devicesTree = new Device.views.NavigationList({
        collection: this.devices
      });

      // Listen for a device to be clicked and change view
      this.listenTo(Backbone, 'click:device', function(device){
        that.selectDevice(device);
      });
    }
  });
});
