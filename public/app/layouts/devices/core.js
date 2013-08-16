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
      powerAndIrradiance: '.chart.powerAndIrradiance',
      currentAndVoltage: '.chart.currentAndVoltage',
      children: '.chart.children'
    },

    onShow: function(){
      console.log(this.model);
      Backbone.trigger(
        'set:breadcrumbs',
        {
          model: this.options.model,
          state: 'device',
          display_name: this.options.model.get('devtype')+' '+this.options.model.get('did')
        }
      );

      this.buildCharts();

      if (this.model.get('dev_type') !== 'Panel' && this.model.outgoing.length) {
        this.buildChildChart();
      }
    },

    buildCharts: function(){
      var project = this.options.project;

      var powerAndIrradiance = new Chart.views.Basic({
        traces: [
          Chart.dataDefaults(project, this.model, 'irradiance'),
          Chart.dataDefaults(project, this.model, 'power')
        ],
        series: [
          Chart.seriesDefaults.irradiance,
          Chart.seriesDefaults.power
        ]
      });

      var currentAndVoltage = new Chart.views.Basic({
        traces: [
          Chart.dataDefaults(project, this.model, 'current'),
          Chart.dataDefaults(project, this.model, 'voltage')
        ],
        series: [
          Chart.seriesDefaults.current,
          Chart.seriesDefaults.voltage
        ]
      });

      this.powerAndIrradiance.show(powerAndIrradiance);
      this.currentAndVoltage.show(currentAndVoltage);
    },

    buildChildChart: function(){
      var traces = [],
          series = [];

      this.model.outgoing.each(function(child, index){
        if (index < 2) {
          traces.push(Chart.dataDefaults(this.options.project, child, 'power'));
          series.push({
            name: 'Power (' + child.get('did') + ')',
            unit: 'W'
          });
        }
      }, this);

      var children = new Chart.views.Basic({
        traces: traces,
        series: series
      });

      console.log(children);

      this.children.show(children);
    }
  });
});
