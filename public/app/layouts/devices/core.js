define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'device',
  'chart',

  'hbs!layouts/devices/templates/core'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  Device,
  Chart,

  CoreTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: CoreTemplate
    },

    regions: {
      chart_powerAndIrradiance: '.chart_powerAndIrradiance',
      chart_currentAndVoltage: '.chart_currentAndVoltage'
    },

    onShow: function(){
      Backbone.trigger(
        'set:breadcrumbs',
        {
          model: this.options.model,
          state: 'device',
          display_name: this.options.model.get('devtype')+' '+this.options.model.get('did')
        }
      );

      this.buildCharts();
    },

    buildCharts: function(){
      var project = this.options.project;

      var chart_powerAndIrradiance = new Chart.views.Line({
        model: new Chart.models.timeSeries().set({
          'traces': [
            Chart.dataDefaults(project, this.model, 'irradiance'),
            Chart.dataDefaults(project, this.model, 'power')
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
            Chart.dataDefaults(project, this.model, 'current'),
            Chart.dataDefaults(project, this.model, 'voltage')
          ]
        }),
        series: [
          Chart.seriesDefaults.current,
          Chart.seriesDefaults.voltage
        ]
      });

      this.chart_powerAndIrradiance.show(chart_powerAndIrradiance);
      this.chart_currentAndVoltage.show(chart_currentAndVoltage);
    }
  });
});
