define([
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',

  'hbs!layouts/templates/portfolioDetail'
], function(
  $,
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
      contentNavigation: '.nav_content'
    },

    onShow: function(){
      // Poulate detail layout
      this.contentNavigation.show(this.portfolioNavigationListView);
      this.projects.show(this.projectTable);
      this.map.show(this.mapView);

      // Select context
      this.selectPortfolio(this.options.model);
    },

    selectPortfolio: function(model) {
      // Build KPIs
      var kpis = new Portfolio.views.AggregateKpis({ model: model });
      this.kpis.show(kpis);

      // Update the collection.
      this.projectList.set(model.projects.models);
      Backbone.trigger('set:breadcrumbs', {model: model, state: 'portfolio'});

      // Reset active indicator
      $('.nav_content').find('.active').removeClass('active');

      // Find current model view and set active
      this.portfolioNavigationListView.children.each(function(view){
        if (view.model.id === model.id) {
          view.$el.addClass('active');
          return;
        }
      });
    },

    initialize: function(options){
      // Build primary portfolio nav
      this.portfolioNavigationListView = new Portfolio.views.NavigationListView({
        collection: options.portfolios
      });

      // Init shared project collection
      this.projectList = new Project.Collection(options.model.projects.models);

      // Extend map view for marker filtering
      this.mapView = new Project.views.Map({ collection: this.projectList });

      // Init project table
      this.projectTable = new Project.views.DataListView({
        collection: this.projectList
      });

      this.listenTo(Backbone, 'click:portfolio', function(model){
        this.selectPortfolio(model);

        Backbone.history.navigate('/portfolio/' + model.id);
      });
    }
  });
});
