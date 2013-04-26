define([
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',

  'ia',

  'portfolio',
  'project',

  'app/layouts/main',
  'app/layouts/portfolioDetail',
  'app/layouts/projectDetail',
  'app/layouts/portfolioDashboard',
  'app/layouts/profile'
],
function(
  _,
  Backbone,
  Marionette,
  MarionetteHandlebars,
  ia,
  Portfolio,
  Project,
  MainLayout,
  PortfolioDetailLayout,
  ProjectDetailLayout,
  PortfolioDashboardLayout,
  ProfileLayout
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

      this.mainLayout.updateBreadcrumbs(portfolio);
      this.mainLayout.mainContent.show( new PortfolioDetailLayout({model: portfolio, collection: subPortfolios}) );
    },

    project: function(id){
      var project = ia.allProjects.get(id);

      this.currentState = 'projectDetail';

      this.mainLayout.updateBreadcrumbs(project);
      this.mainLayout.mainContent.show( new ProjectDetailLayout({model: project}) );
    },

    profile: function(){
      this.mainLayout.updateBreadcrumbs({name: 'My Profile'});
      this.mainLayout.mainContent.show( new ProfileLayout( {model: ia.currentUser }));
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
      'profile': 'profile'
    }
  });

  return Router;

});

