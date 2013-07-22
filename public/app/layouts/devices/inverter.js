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
        project = this.options.project,
        traces = [],
        series = []
      ;

      project.findDataSources().done(function(dataSources){
        // Add irradiance trace
        traces.push(Chart.dataDefaults(project, that.model, 'irradiance'));
        series.push(Chart.seriesDefaults.irradiance);

        // Selectively populate power traces
        if (dataSources.inverter.ac_power) {
          traces.push({
            'project_label': project.id,
            'ddl': 'inv',
            'dtstart': 'today',
            'dtstop': 'now',
            'columns': ['freezetime', 'ac_power'],
            'filters': [
              {
                'column': 'identifier',
                'in_set': [that.model.get('graph_key')]
              }
            ],
            project_timezone: project.timezone || null
          });

          series.push(Chart.seriesDefaults.power);
        }

        var chart_powerAndIrradiance = new Chart.views.Line({
          model: new Chart.models.timeSeries().set({
            'traces': traces
          }),
          series: series
        });

        var chart_currentAndVoltage = new Chart.views.Line({
          model: new Chart.models.timeSeries().set({
            'traces': [
              Chart.dataDefaults(project, that.model, 'current'),
              Chart.dataDefaults(project, that.model, 'voltage')
            ]
          }),
          series: [
            Chart.seriesDefaults.current,
            Chart.seriesDefaults.voltage
          ]
        });

        that.chart_powerAndIrradiance.show(chart_powerAndIrradiance);
        that.chart_currentAndVoltage.show(chart_currentAndVoltage);
      });
    }
  });
});
