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

    onShow: function(){
      Backbone.trigger(
        'set:breadcrumbs',
        {
          model: this.options.model,
          state: 'issue',
          display_name: this.options.model.get('display_name')
        }
      );
    },

    buildChart: function(){
      var
        project = this.options.project,
        device = project.devices.findWhere({graph_key: this.model.get('identifier')}),
        // Add an hour to either side of time range
        startTime = this.model.get('fault_start') - (60 * 60),
        stopTime = this.model.get('fault_stop') + (60 * 60)
      ;

      this.$el.find('.deviceName').text(device.get('did'));

      var chart_powerAndIrradiance = new Chart.views.Line({
        model: new Chart.models.timeSeries().set({
          'traces': [
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
          ]
        }),
        series: [
          Chart.seriesDefaults.irradiance,
          Chart.seriesDefaults.power
        ]
      });

      this.chart.show(chart_powerAndIrradiance);
    },

    initialize: function(options){
      var that = this;

      // Fetch project to get devices
      this.options.project.fetch({data: {project_label: options.project.id}}).done(function(){
        that.buildChart();
      });
    }
  });
});
