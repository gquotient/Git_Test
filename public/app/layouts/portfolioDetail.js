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
      this.projects.show(this.projectListView);
      this.map.show(this.mapView);
    },

    selectPortfolio: function(model) {
      console.log('selectPortfolio');
      // Build KPIs
      var kpis = new Portfolio.views.DetailKpis({ model: model });
      this.kpis.show(kpis);

      // Update the collection.
      this.projectList.set(model.projects.models);
      Backbone.trigger('update:breadcrumbs', model);

      // Reset active indicator
      $('.nav_content').find('.active').removeClass('active');
      $('.nav_content').find('#' + model.id).addClass('active');
      console.log(this.portfolioNavigationListView);

      // Find current model view and set active
      this.portfolioNavigationListView.children.each(function(view){
        console.log(view);
        console.log(view.model.id, model.id);
        if (view.model.id === model.id) {
          view.$el.addClass('active');
        }
      });
    },

    initialize: function(options){
      // Build primary portfolio nav
      this.portfolioNavigationListView = new Portfolio.views.NavigationListView({
        collection: options.portfolios
      });

      this.projectList = options.model.projects.clone();

      // Extend map view for marker filtering
      this.mapView = new Project.views.Map({ collection: this.projectList });

      this.projectListView = new Project.views.DataListView({
        collection: this.projectList
      });

      this.selectPortfolio(options.model);

      this.listenTo(Backbone, 'click:portfolio', function(model){
        this.selectPortfolio(model);

        Backbone.history.navigate('/portfolio/' + model.id);
      });
    }
  });
});
