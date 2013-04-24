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
    currentState: 'index',

    index: function(){
      this.portfolio();
      Backbone.history.navigate('portfolio/all');
    },

    portfolio_dashboard: function(id){
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

      Backbone.trigger('layout:portfolioDashboard', portfolio, subPortfolios);

      this.currentState = 'portfolio_dashboard';
    },

    portfolio: function(id){
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

      Backbone.trigger('layout:portfolioDetail', portfolio, subPortfolios);
    },

    project: function(id){
      console.log('route:project', id);
      var project = ia.allProjects.get(id);

      Backbone.trigger('layout:projectDetail', project);

      this.currentState = 'project';
    },

    profile: function(){
      Backbone.trigger('layout:profile');
    },

    initialize: function(){
      var that = this;

      this.layoutController = new Controller(ia);

      this.listenTo(Backbone, 'select:portfolio', function(model){
        console.log('router', model);
      });
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
