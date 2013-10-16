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
        series = [],
        date = this.options.date
      ;

      // Hide current and voltage chart
      $('.currentAndVoltage').hide();

      project.findDataSources().done(function(dataSources){
        // Add irradiance trace
        traces.push(Chart.dataDefaults(project, that.model, 'irradiance'));
        series.push(Chart.seriesDefaults.irradiance);

        // Populate chart w/ AC power if available
        if (dataSources.inverter.ac_power) {
          traces.push({
            'project_label': project.id,
            'ddl': 'inv',
            'dtstart': date ? date.start/1000 : 'today',
            'dtstop': date ? date.stop/1000 : 'now',
            'columns': ['freezetime', 'ac_power_mean'],
            'filters': [
              {
                'column': 'identifier',
                'in_set': [that.model.get('graph_key')]
              }
            ],
            project_timezone: project.get('timezone')
          });

          series.push(Chart.seriesDefaults.power);
        } else if (dataSources.inverter.bus) {
          traces.push({
            'project_label': project.id,
            'ddl': 'inv-bus-calc',
            'dtstart': date ? date.start/1000 : 'today',
            'dtstop': date ? date.stop/1000 : 'now',
            'columns': ['freezetime', 'dc_power'],
            'filters': [
              {
                'column': 'identifier',
                'in_set': [that.model.get('graph_key')]
              }
            ],
            project_timezone: project.get('timezone')
          });

          series.push(Chart.seriesDefaults.power);
        }

        var chart_powerAndIrradiance = new Chart.views.Basic({
          traces: traces,
          series: series
        });

        that.powerAndIrradiance.show(chart_powerAndIrradiance);
      });
    }
  });
});
