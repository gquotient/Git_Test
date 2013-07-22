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
        project = this.options.project
      ;

      project.findDataSources().done(function(dataSources){
        var chart_powerAndIrradiance = new Chart.views.Line({
          model: new Chart.models.timeSeries().set({
            'traces': [
              Chart.dataDefaults(project, that.model, 'irradiance'),
              Chart.dataDefaults(project, that.model, 'power')
            ]
          }),
          series: [
            Chart.seriesDefaults.irradiance,
            Chart.seriesDefaults.power
          ]
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
