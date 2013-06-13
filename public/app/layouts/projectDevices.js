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
      contentNavigation: '.nav_content',
      deviceInfo: '.deviceInfo'
    },

    selectDevice: function(id){
      console.log('select device', arguments);
      var myDevice = this.model.devices.findWhere({id: id});

      console.log('my device', myDevice);

      Backbone.history.navigate('/project/' + this.model.id + '/devices/' + id);

      this.deviceInfo.show(new Marionette.Layout({template: _.template('Device: <%= id %> <br> Graphkey: <%= graph_key %>'), model: myDevice}));
    },

    onShow: function(){
      this.contentNavigation.show(this.devicesTree);
    },

    events: {
      'click .device a': function(event){
        event.preventDefault();
        console.log(event, this);
        this.selectDevice(event.toElement.id);
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
        that.devicesTree.collection.reset(that.model.devices.where({devtype: 'Inverter'}));

        if (options.currentDevice) {
          that.selectDevice(options.currentDevice);
        }
      });
    }
  });
});
