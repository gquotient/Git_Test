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
        chartsLayout = new Marionette.Layout({template: _.template(template)});
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
            {
              'project_label': this.model.id,
              'ddl': 'env',
              'dtstart': 'today',
              'dtstop': 'now',
              'columns': ['freezetime', 'value_mean'],
              'filters': [
                {'column': 'attribute', 'in_set': ['irradiance']},
                {'column': 'identifier', 'in_set': ['IRR-1']}
              ]
            },
            {
              'project_label': this.model.id,
              'ddl': ddl[device.get('devtype')],
              'dtstart': 'today',
              'columns': ['freezetime', 'dc_power_output'],
              'filters': [
                {
                  'column': 'identifier',
                  'in_set': [device.get('graph_key')]
                }
              ]
            }
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
            {
              'project_label': this.model.id,
              'ddl': 'pnl',
              'dtstart': 'today',
              'columns': ['freezetime', 'dc_current_output'],
              'filters': [
                {
                  'column': 'identifier',
                  'in_set': [device.get('graph_key')]
                }
              ]
            },
            {
              'project_label': this.model.id,
              'ddl': 'pnl',
              'dtstart': 'today',
              'columns': ['freezetime', 'dc_voltage_output'],
              'filters': [
                {
                  'column': 'identifier',
                  'in_set': [device.get('graph_key')]
                }
              ]
            }
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
