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
        }

        if (dataSources.inverter.bus) {
          that.model.outgoing.each(function(device){
            if (device.get('devtype') === 'DC Bus') {
              traces.push({
                'project_label': project.id,
                'ddl': 'bus-str-calc',
                'dtstart': 'today',
                'dtstop': 'now',
                'columns': ['freezetime', 'dc_power'],
                'filters': [
                  {
                    'column': 'identifier',
                    'in_set': [device.get('graph_key')]
                  }
                ],
                project_timezone: project.get('timezone')
              });

              series.push({
                name: 'Power ' + device.get('did'),
                unit: 'W',
                color: null
              });
            }
          });
        }

        var chart_powerAndIrradiance = new Chart.views.Line({
          model: new Chart.models.timeSeries().set({
            'traces': traces
          }),
          series: series
        });

        that.chart_powerAndIrradiance.show(chart_powerAndIrradiance);
      });
    }
  });
});
