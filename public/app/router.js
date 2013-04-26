define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'ia',

  'portfolio',
  'project',
  'error',

  'app/layouts/helpers',
  'app/layouts/main',
  'app/layouts/portfolioDetail',
  'app/layouts/projectDetail',
  'app/layouts/portfolioDashboard',
  'app/layouts/profile',
  'app/layouts/admin'
],
function(
  $,
  _,
  Backbone,
  Marionette,

  ia,

  Portfolio,
  Project,
  Error,

  Helpers,
  MainLayout,
  PortfolioDetailLayout,
  ProjectDetailLayout,
  PortfolioDashboardLayout,
  ProfileLayout,
  AdminLayout
){
  var RouteController = Backbone.Marionette.Controller.extend({
    index: function(){
      Backbone.history.navigate('portfolio/all', true);
    },

    portfolio_dashboard: function(id){
      var portfolio, subPortfolios;

      if (id && id !== 'all') {
        // Build custom portfolios view
        portfolio = ia.allPortfolios.get(id);
        subPortfolios = portfolio.get('subPortfolios');
      } else {
        // Build primary portfolios view
        portfolio = ia.allPortfoliosPortfolio;
        subPortfolios = new Portfolio.collections.NavigationList(ia.allPortfolios.models);
      }

      this.currentState = 'portfolioDashboard';
      this.mainLayout.updateBreadcrumbs(portfolio);
      this.mainLayout.mainContent.show( new PortfolioDashboardLayout({model: portfolio, collection: subPortfolios }) );
    },

    portfolio: function(id){
      var portfolio, subPortfolios;

      if (id && id !== 'all') {
        // Build custom portfolios view
        portfolio = ia.allPortfolios.get(id);
        subPortfolios = portfolio.get('subPortfolios');
      } else {
        // Build primary portfolios view
        portfolio = ia.allPortfoliosPortfolio;
        subPortfolios = new Portfolio.collections.NavigationList(ia.allPortfolios.models);
      }

      // Build detail view if not currently there
      // NOTE: this is for back/forward support
      if (!$('.portfolioDetail').length) {
        this.mainLayout.updateBreadcrumbs(portfolio);
        this.mainLayout.mainContent.show( new PortfolioDetailLayout({model: portfolio, collection: subPortfolios}) );
      } else {
        // Trigger select event
        Backbone.trigger('select:portfolio', portfolio);
      }
    },

    project: function(id){
      var project = ia.allProjects.get(id);

      this.currentState = 'projectDetail';

      this.mainLayout.updateBreadcrumbs(project);
      this.mainLayout.mainContent.show( new ProjectDetailLayout({model: project}) );
    },

    profile: function(){
      this.mainLayout.updateBreadcrumbs({name: 'My Profile'}, true);
      this.mainLayout.mainContent.show( new ProfileLayout( {model: ia.currentUser }));
    },

    admin: function(){
      this.mainLayout.updateBreadcrumbs({name: 'Admin'}, true);
      this.mainLayout.mainContent.show( new AdminLayout({}) );
    },

    initialize: function(){
      var that = this;
      this.mainLayout = new MainLayout(ia);
      ia.main.show(this.mainLayout);
    }
  });

  var Router = Backbone.Marionette.AppRouter.extend({
    controller: new RouteController(),
    appRoutes: {
      '': 'index',
      'portfolio': 'index',
      'portfolio/:id': 'portfolio',
      'portfolio/dashboard': 'portfolio_dashboard',
      'portfolio/dashboard/:id': 'portfolio_dashboard',
      'project/:id': 'project',
      'profile': 'profile',
      'admin': 'admin'
    }
  });

  return Router;

});

