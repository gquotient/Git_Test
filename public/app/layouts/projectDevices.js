define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'project',
  'device',
  'chart',

  'hbs!layouts/templates/projectDevices'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  Project,
  Device,
  Chart,

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
      deviceInfo: '.deviceInfo',
      charts: '.charts'
    },

    selectDevice: function(id){
      var device = this.model.devices.findWhere({id: id});

      Backbone.history.navigate('/project/' + this.model.id + '/devices/' + id);

      this.deviceInfo.show(new Marionette.Layout({template: _.template('Device: <%= id %> <br> Graphkey: <%= graph_key %>'), model: device}));

      this.buildCharts(device);
    },

    buildCharts: function(device){
      var
        template = [
          '<div class="chart_powerAndIrradiance"></div>',
          '<div class="chart_currentAndVoltage"></div>'
        ].join(''),
        chartsLayout = new Marionette.Layout({template: _.template(template)}),
        ddl = {
          'Panel': 'pnl',
          'String': 'str-pnl-calc',
          'Inverter': 'inv-pnl-calc'
        }
      ;

      this.charts.show(chartsLayout);

      chartsLayout.addRegions({
        chart_powerAndIrradiance: '.chart_powerAndIrradiance',
        chart_currentAndVoltage: '.chart_currentAndVoltage'
      });

      var chart_powerAndIrradiance = new Chart.views.Line({
        model: new Chart.models.timeSeries().set({
          'timezone': this.model.get('timezone'),
          'dataType': [
            Chart.dataDefaults(this.model, device, 'irradiance'),
            Chart.dataDefaults(this.model, device, 'power')
          ]
        }),
        series: [
          Chart.seriesDefaults.irradiance,
          Chart.seriesDefaults.power
        ]
      });

      var chart_currentAndVoltage = new Chart.views.Line({
        model: new Chart.models.timeSeries().set({
          'timezone': this.model.get('timezone'),
          'dataType': [
            Chart.dataDefaults(this.model, device, 'current'),
            Chart.dataDefaults(this.model, device, 'voltage')
          ]
        }),
        series: [
          Chart.seriesDefaults.current,
          Chart.seriesDefaults.voltage
        ]
      });

      chartsLayout.chart_powerAndIrradiance.show(chart_powerAndIrradiance);
      chartsLayout.chart_currentAndVoltage.show(chart_currentAndVoltage);
    },

    onShow: function(){
      this.contentNavigation.show(this.devicesTree);
    },

    events: {
      'click .device a': function(event){
        event.preventDefault();

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
