define([
  'backbone',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',

  'hbs!layouts/templates/portfolioDetail'
], function(
  Backbone,
  Marionette,
  Handlebars,

  Portfolio,
  Project,

  portfolioDetailTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: portfolioDetailTemplate
    },
    attributes: {
      id: 'page-portfolioDetail'
    },
    regions: {
      kpis: '#kpis',
      map: '#map',
      projects: '#projects',
      contentNavigation: '.column_left'
    },

    onShow: function(){
        // Poulate detail layout
        this.contentNavigation.show(this.portfolioNavigationListView);
        this.kpis.show(this.kpisView);
        this.projects.show(this.projectListView);
        this.map.show(this.mapView);
      },

    initialize: function(options){
      // Build primary portfolio nav
      this.portfolioNavigationListView = new Portfolio.views.NavigationListView({
        collection: options.model.portfolios
      });

      // Build KPIs
      this.kpisView = new Portfolio.views.DetailKpis({ model: options.model }),

      this.projectList = options.model.projectModels.clone();

      // Extend map view for marker filtering
      this.mapView = new Project.views.Map({ collection: this.projectList });

      this.projectListView = new Project.views.DataListView({
        collection: this.projectList
      });

      this.listenTo(Backbone, 'select:portfolio', function(model){
        // Update the collection.
        this.projectList.set(model.projectModels.models);
        Backbone.trigger('set:breadcrumbs', model);
      });

      this.currentState = 'portfolioDetail';

      // Set up listeners
      this.listenTo(Backbone, 'select:portfolio', function(model){
        // Set address bar
        Backbone.history.navigate('/portfolio/' + model.id);
      });

      this.listenTo(Backbone, 'select:project', function(model){
        // Set address bar and force routing
        Backbone.history.navigate('/project/' + model.id, true);
      });
    }
  });
});
