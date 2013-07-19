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
      charts: '.charts'
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

    buildCharts: function(device){
      var
        project = this.options.project,
        template = [
          '<div class="chart_powerAndIrradiance"></div>',
          '<div class="chart_currentAndVoltage"></div>'
        ].join(''),
        chartsLayout = new Marionette.Layout({template: _.template(template)}),
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
          'dataType': [
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
          'dataType': [
            Chart.dataDefaults(project, this.model, 'current'),
            Chart.dataDefaults(project, this.model, 'voltage')
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

    initialize: function(options){

    }
  });
});
