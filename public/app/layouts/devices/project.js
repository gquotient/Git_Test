define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'device',
  'chart',

  'layouts/devices/core'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  Device,
  Chart,

  CoreLayout
){
  return CoreLayout.extend({
    buildCharts: function(){
      var
        that = this,
        project = this.model,
        traces = [],
        series = [],
        date = this.options.date
      ;

      // Hide current and voltage chart
      $('.currentAndVoltage').hide();

      this.model.findDataSources().done(function(dataSources){
        // Build charts
        var powerAndIrradiance = new Chart.views.Basic({
          traces: [
            {
              'project_label': project.id,
              'ddl': 'pgen-env',
              'dtstart': 'today',
              'dtstop': 'now',
              'columns': ['freezetime', 'irradiance'],
              'project_timezone': that.model.get('timezone')
            },
            {
              'project_label': project.id,
              'ddl': dataSources.energy,
              'dtstart': 'today',
              'dtstop': 'now',
              'columns': ['freezetime', 'ac_power'],
              'project_timezone': that.model.get('timezone')
            }
          ],
          series: [
            Chart.seriesDefaults.irradiance,
            Chart.seriesDefaults.power
          ]
        });

        that.powerAndIrradiance.show(powerAndIrradiance);
      });
    }
  });
});
