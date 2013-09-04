define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'project',
  'device',
  'chart',
  'issue',

  'hbs!layouts/issues/templates/core'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  Project,
  Device,
  Chart,
  Issue,

  CoreTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: CoreTemplate
    },

    regions: {
      chart: '.chart',
      deviceName: '.deviceName'
    },

    events: {
      'click .device': function(event){
        event.preventDefault();
        Backbone.history.navigate('/project/' + this.project.id + '/devices/' + this.device.get('graph_key'), true);
      }
    },

    onShow: function(){
      Backbone.trigger(
        'set:breadcrumbs',
        {
          model: this.options.model,
          state: 'issue',
          display_name: this.options.model.get('display_name')
        }
      );

      // This stuff needs to be in the onShow because it needs the dom elements to work
      var that = this;

      var initialView = function(){
        that.device = that.project.devices.findWhere({graph_key: that.model.get('identifier')});
        that.buildChart();
      };
      // Fetch project to get devices
      if (this.options.project.devices.length) {
        initialView();
      } else {
        this.options.project.fetch({data: {project_label: this.project.id}}).done(initialView);
      }
    },

    buildChart: function(){
      var
        project = this.project,
        device = this.device,
        // Add an hour to either side of time range
        startTime = this.model.get('fault_start') - (60 * 60),
        stopTime = this.model.get('fault_stop') + (60 * 60),
        localTime = this.model.getLocalDate()
      ;

      // Add link to device
      this.$el.find('.deviceName').html('<a href="#' + device.get('graph_key') + '" class="device">' + device.get('did') + '</a>');

      // Instantiate chart
      var chart_powerAndIrradiance = new Chart.views.Basic({
        chartOptions: {
          xAxis: {
            plotBands: {
              color: 'rgba(201, 77, 30, .25)',
              from: localTime.start,
              to: localTime.stop
            }
          }
        },
        traces: [
          {
            'project_label': project.id,
            'ddl': 'pgen-env',
            'dtstart': startTime,
            'dtstop': stopTime,
            'columns': ['freezetime', 'irradiance'],
            project_timezone: project.get('timezone')
          },
          {
            'project_label': project.id,
            'ddl': this.model.get('device_type'),
            'dtstart': startTime,
            'dtstop': stopTime,
            'columns': ['freezetime', this.model.get('device_column')],
            'filters': [
              {
                'column': 'identifier',
                'in_set': [device.get('graph_key')]
              }
            ],
            project_timezone: project.get('timezone')
          }
        ],
        series: [
          Chart.seriesDefaults.irradiance,
          Chart.seriesDefaults.power
        ]
      });

      console.log(chart_powerAndIrradiance);

      this.chart.show(chart_powerAndIrradiance);
    },
    initialize: function(options){
      console.log(this.model);
      var that = this;

      this.project = options.project;
    }
  });
});
