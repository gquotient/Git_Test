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
  'layouts/devices/project',

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
  DateSelection,

  CoreLayout,
  InverterLayout,
  ProjectLayout,

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
      deviceDetail: '.deviceDetail',
      sitemap: '.sitemapContainer'
    },

    deviceLayouts: {
      core: CoreLayout,
      Inverter: InverterLayout,
      'PV Array': ProjectLayout
    },

    date: null,

    initialize: function(options){
      var that = this;

      Backbone.trigger('set:breadcrumbs', {state:'device', display_name:'Devices'});

      // Instantiate devices collection view
      this.devices = new Device.Collection();

      this.devicesTree = new Device.views.NavigationList({
        collection: this.devices
      });

      if (this.model.get('hasDC')){
        this.devicesMap = new Device.views.Sitemap({
          model: this.model,
          collection: this.model.devices
        });
      } else {
        this.$el.find('.sitemapContainer').hide();
      }

      // Listen for a device to be clicked and change view
      this.listenTo(Backbone, 'click:device', function(device){
        that.selectDevice(device);
      });

      this.listenTo(Backbone, 'set:date', function(date){
        this.date = date;
      });
    },

    selectDevice: function(device){
      var deviceType = device.get('devtype') || null;

      // Build device specific detail layout
      var SubLayout = (deviceType && this.deviceLayouts[deviceType]) ? this.deviceLayouts[deviceType] : this.deviceLayouts.core;

      // Show layout
      this.deviceDetail.show(new SubLayout({
        model: device,
        project: this.model,
        date: this.date
      }));

      if (this.devicesMap) {
        this.devicesMap.selectDevice(device);
      }

      // Set active nav el
      //NOTE - this is a special recursive method on the device tree
      this.devicesTree.propagateActive({graph_key: device.get('graph_key')});
    },

    buildSettingsDropdown: function(){
      var that = this;

      var myDateSelector = new DateSelection.views.Multi({tagName: 'li'});

      this.options.settingsRegion.show(myDateSelector);
    },

    onShow: function(){
      var that = this;

      if (this.devicesMap) {
        this.sitemap.show(this.devicesMap);
      }

      var initialView = function(){
        that.contentNavigation.show(that.devicesTree);

        that.devices.reset(that.model);
        // If router passes a device, build detail view
        if (that.options.currentDevice) {
          var myDevice = that.model.devices.findWhere({graph_key: that.options.currentDevice});
          that.selectDevice(myDevice);
        } else {
          that.selectDevice(that.model);
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

    onClose: function(){
      // Close settings dropdown views
      this.options.settingsRegion.close();
    }
  });
});
