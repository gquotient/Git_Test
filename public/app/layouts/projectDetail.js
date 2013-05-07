define([
  'backbone',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',

  'hbs!layouts/templates/projectDetail'
], function(
  Backbone,
  Marionette,
  Handlebars,

  Portfolio,
  Project,

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
      alarms: '#alarms'
    },

    onShow: function(){
      this.map.show(this.mapView);
    },

    initialize: function(options){
      this.model = options.model;

      this.mapView = new Project.views.Map({
        collection: new Project.Collection([options.model])
      });

      // Set up listeners
      this.listenTo(Backbone, 'select:portfolio', function(model){
        // Set address bar and force routing
        Backbone.history.navigate('/portfolio/' + model.get('id'), true);
      });

      this.listenTo(Backbone, 'select:project', function(model){
        // Set address bar
        Backbone.history.navigate('/project/' + model.get('id'));
      });

      this.listenTo(Backbone, 'edit', function(){
        Backbone.history.navigate('/project/' + this.model.id + '/edit', true);
      });
    }
  });
});
