define(
[
  'jquery',
  'backbone',
  'backbone.marionette',

  'layouts',

  'portfolio',
  'project'
],
function(
  $,
  Backbone,
  Marionette,
  Layouts,
  Portfolio,
  Project
){
  // LAYOUT CONTROLLER
  return Backbone.Marionette.Controller.extend({
    currentState: '',

    portfolioDetail: function(model, collection){
      // Reset breadcrumbs
      var breadcrumbs = [this.app.allPortfoliosPortfolio];

      if (model !== this.app.allPortfoliosPortfolio) {
        breadcrumbs.push(model);
      }

      Backbone.trigger('set:breadcrumbs', breadcrumbs);

      // Build detail view if not currently there
      if (this.currentState !== 'portfolioDetail') {
        // Populate main layout
        var portfolioDetail = new Layouts.PortfolioDetail();

        this.app.layouts.app.mainContent.show(portfolioDetail);

        // Build detail view
        var
          // Build primary portfolio nav
          portfolioNavigationListView = new Portfolio.views.NavigationListView({
            collection: collection,
            model: model
          }),
          // Build KPIs
          kpisView = new Portfolio.views.detailKpis({ model: model }),

          projectList = model.get('projects').clone(),

          // Extend map view for marker filtering
          map = new Project.views.map({
            collection: projectList
          }),

          projectListView = new Project.views.DataListView({
            collection: projectList
          })
        ;

        portfolioDetail.listenTo(Backbone, 'select:portfolio', function(model){
          // Update the collection.
          projectList.set(model.get('projects').models);
        });

        // Poulate detail layout
        portfolioDetail.contentNavigation.show(portfolioNavigationListView);
        portfolioDetail.kpis.show(kpisView);
        portfolioDetail.projects.show(projectListView);
        portfolioDetail.map.show(map);

        this.currentState = 'portfolioDetail';
      } else {
        // Trigger select event - We may want to pull global event
        // listening out of the modules
        Backbone.trigger('select:portfolio', model);
      }
    },

    projectDetail: function(model){
      // Reset Breadcrumbs
      var breadcrumbs = [this.app.allPortfoliosPortfolio, model];

      Backbone.trigger('set:breadcrumbs', breadcrumbs);

      // Build detail view if not currently there
      if (this.currentState !== 'projectDetail') {
        // Populate main layout
        var projectDetail = new Layouts.ProjectDetail({model: model});
        this.app.layouts.app.mainContent.show(projectDetail);

        var map = new Project.views.map({
          collection: new Project.collections.Projects([model])
        });

        // Populate project detail view
        projectDetail.map.show(map);

        this.currentState = 'projectDetail';
      } else {
        // Trigger select event - We may want to pull global event
        // listening out of the modules
        Backbone.trigger('select:project', model);
      }
    },

    portfolioDashboard: function(model, collection){
      var breadcrumbs = [this.app.allPortfoliosPortfolio];
      Backbone.trigger('set:breadcrumbs', breadcrumbs);

      if (this.currentState !== 'portfolioDashboard') {
        var
          dashboardLayout = new Layouts.PortfolioDashboard(),
          projectList = model.get('projects').clone(),
          // Build primary portfolio nav
          portfolioNavigationListView = new Portfolio.views.NavigationListView({
            collection: collection,
            model: model
          }),
          dashboard = new Project.views.Dashboard({ collection: projectList })
        ;

        projectList.listenTo(Backbone, 'select:portfolio', function(model){
          // Update the collection.
          projectList.set(model.get('projects').models);
        });

        this.app.layouts.app.mainContent.show(dashboardLayout);
        dashboardLayout.dashboard.show(dashboard);
        dashboardLayout.contentNavigation.show(portfolioNavigationListView);

        this.currentState = 'portfolioDashboard';
      } else {
        // Trigger select event - We may want to pull global event
        // listening out of the modules
        Backbone.trigger('select:portfolio', model);
      }
    },

    initialize: function(app){
      this.app = app;
      var that = this;

      this.listenTo(Backbone, 'select', function(model){
        console.log('select', that);
        // Set address bar
        Backbone.history.navigate('/' + model.get('type') + '/' + model.get('id'), true);
      });
    }
  });
});
