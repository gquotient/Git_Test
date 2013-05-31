define([
  'backbone',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',

  'chart',

  'hbs!layouts/templates/projectDetail'
], function(
  Backbone,
  Marionette,
  Handlebars,

  Portfolio,
  Project,

  Chart,

  projectDetailTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: projectDetailTemplate
    },

    attributes: {
      id: 'page-projectDetail'
    },

    regions: {
      map: '#map',
      kpis: '#kpis',
      alarms: '#alarms',
      chart: '#chart'
    },

    events: {
      'click .edit': function(){
        Backbone.history.navigate('/project/' + this.model.id + '/edit', true);
      }
    },

    onShow: function(){
      this.map.show(this.mapView);

      this.chart.show(this.chartView);
    },

    initialize: function(options){
      this.model = options.model;

      this.mapView = new Project.views.Map({
        collection: new Project.Collection([options.model])
      });

      this.chartView = new Chart.views.Line({
        title: 'Array Power',
        model: new Chart.models.timeSeries({url: '/api/arrayPower'}),
        series: [
          {
            color: '#369',
            data: []
          }
        ]
      });

      // Set up listeners
      this.listenTo(Backbone, 'select:portfolio', function(model){
        // Set address bar and force routing
        Backbone.history.navigate('/portfolio/' + model.id, true);
      });

      this.listenTo(Backbone, 'select:project', function(model){
        // Set address bar
        Backbone.history.navigate('/project/' + model.id);
      });
    }
  });
});
