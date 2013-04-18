define([
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',

  'ia',

  'user',
  'portfolio',
  'project',
  'layouts'
],
function(_, Backbone, Marionette, MarionetteHandlebars, ia, User, Portfolio, Project, Layouts){

  ia.Controller = Backbone.Marionette.Controller.extend({
    currentState: 'index',

    index: function(){
      this.select_portfolio();
      Backbone.history.navigate('portfolio/all');
    },

    select_portfolio: function(id){
      var portfolio, subPortfolios;

      if (id && id !== 'all') {
        // Build custom portfolios view
        portfolio = ia.allPortfolios.get(id);
        subPortfolios = portfolio.get("subPortfolios");
      } else {
        // Build primary portfolios view
        portfolio = ia.allPortfoliosPortfolio;
        subPortfolios = new Portfolio.collections.NavigationList(ia.allPortfolios.models);
      }

      this.portfolio( { collection: subPortfolios, model: portfolio } );
    },

    select_portfolio_dashboard: function(id){
      var portfolio, subPortfolios;

      if (id && id !== 'all') {
        // Build custom portfolios view
        portfolio = ia.allPortfolios.get(id);
        subPortfolios = portfolio.get("subPortfolios");
      } else {
        // Build primary portfolios view
        portfolio = ia.allPortfoliosPortfolio;
        subPortfolios = new Portfolio.collections.NavigationList(ia.allPortfolios.models);
      }

      this.portfolio_dashboard( { collection: subPortfolios, model: portfolio } );
    },

    portfolio_dashboard: function(options){

      var
        dashboardLayout = new Layouts.PortfolioDashboard(),
        projectList = options.model.get('projects').clone(),
        // Build primary portfolio nav
        portfolioNavigationListView = new Portfolio.views.NavigationListView({
          collection: options.collection,
          model: options.model
        }),
        dashboard = new Project.views.Dashboard({ collection: projectList });

      ia.layouts.app.mainContent.show(dashboardLayout);
      dashboardLayout.dashboard.show(dashboard);
      dashboardLayout.contentNavigation.show(portfolioNavigationListView);
    },

    portfolio: function(options){
      // Reset Breadcrumbs
      var breadcrumbs = [ia.allPortfoliosPortfolio];

      if (options.model !== ia.allPortfoliosPortfolio) {
        breadcrumbs.push(options.model);
      }

      this.update_breadcrumbs(breadcrumbs);

      // Populate main layout
      var portfolioDetail = new Layouts.PortfolioDetail();

      ia.layouts.app.mainContent.show(portfolioDetail);

      // Build detail view
      var
        // Build primary portfolio nav
        portfolioNavigationListView = new Portfolio.views.NavigationListView({
          collection: options.collection,
          model: options.model
        }),
        // Build KPIs
        kpisView = new Portfolio.views.detailKpis({ model: options.model }),

        projectList = options.model.get('projects').clone();

        // Extend map view for marker filtering
        map = new Project.views.map({
          collection: projectList
        }),

        projectListView = new Project.views.DataListView( { collection: projectList } )
      ;

      // Poulate detail layout
      portfolioDetail.contentNavigation.show(portfolioNavigationListView);
      portfolioDetail.kpis.show(kpisView);
      portfolioDetail.projects.show(projectListView);
      portfolioDetail.map.show(map);

      this.currentState = 'portfolio';
    },

    select_project: function(id){
      this.project({model: ia.allProjects.get(id)});
    },

    project: function(options){
      // Reset Breadcrumbs
      var breadcrumbs = [ia.allPortfoliosPortfolio, options.model];
      this.update_breadcrumbs(breadcrumbs);

      // Populate main layout
      var projectDetail = new Layouts.ProjectDetail({model: options.model});
      ia.layouts.app.mainContent.show(projectDetail);

      var map = new Project.views.map({
        collection: new Project.collections.Projects([options.model])
      });

      // Populate project detail view
      projectDetail.map.show(map);

      this.currentState = 'project';
    },

    update_breadcrumbs: function(models){
      // This is simple-minded but I have a feeling this abstraction will end up being useful
      Backbone.trigger('set:breadcrumbs', models);
    },

    initialize: function(){
      var that = this;

      this.listenTo(Backbone, 'select', function(model){
        // Set address bar
        Backbone.history.navigate('/' + model.get('type') + '/' + model.get('id'));

        // Build the page type if not already built
        if (that.currentState !== model.get('type')) {
          that['select_' + model.get('type')](model.get('id'));
        }
      });
    }
  });

  var Router = Backbone.Marionette.AppRouter.extend({
    controller: new ia.Controller(),
    appRoutes: {
      '': 'index',
      'portfolio': 'index',
      'portfolio/:id': 'select_portfolio',
      'portfolio/dashboard/:id': 'select_portfolio_dashboard',
      'project': 'project',
      'project/:id': 'select_project'
    }
  });

  return Router;

});
