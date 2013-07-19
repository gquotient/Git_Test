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
      chart: '.chart'
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
      var project = this.options.project,
        device = project.devices.findWhere({graph_key: this.model.get('identifier')});

      var chart_powerAndIrradiance = new Chart.views.Line({
        model: new Chart.models.timeSeries().set({
          'dataType': [
            Chart.dataDefaults(project, device, 'irradiance', project.get('timezone')),
            Chart.dataDefaults(project, device, 'power', project.get('timezone'))
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
