define([
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',

  'ia',

  'portfolio',
  'project',

  'app/controller'
],
function(_, Backbone, Marionette, MarionetteHandlebars, ia, Portfolio, Project, Controller){

  ia.Controller = Backbone.Marionette.Controller.extend({
    index: function(){
      //this.portfolio();
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

      this.layoutController.portfolioDashboard(portfolio, subPortfolios);
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

      this.layoutController.portfolioDetail(portfolio, subPortfolios);
    },

    project: function(id){
      var project = ia.allProjects.get(id);

      this.layoutController.projectDetail(project);
    },

    profile: function(){
      Backbone.trigger('layout:profile');
    },

    initialize: function(){
      var that = this;

      this.layoutController = new Controller(ia);
    }
  });

  var Router = Backbone.Marionette.AppRouter.extend({
    controller: new ia.Controller(),
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
