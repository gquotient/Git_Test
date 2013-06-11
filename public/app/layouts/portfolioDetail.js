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
        collection: options.portfolios
      });

      // Build KPIs
      this.kpisView = new Portfolio.views.DetailKpis({ model: options.model }),

      this.projectList = options.model.projects.clone();

      // Extend map view for marker filtering
      this.mapView = new Project.views.Map({ collection: this.projectList });

      this.projectListView = new Project.views.DataListView({
        collection: this.projectList
      });

      this.listenTo(Backbone, 'click:portfolio', function(model){
        // Update the collection.
        this.projectList.set(model.projects.models);
        Backbone.trigger('update:breadcrumbs', model);
        Backbone.history.navigate('/portfolio/' + model.id);
      });
    }
  });
});
