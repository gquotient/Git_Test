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

      Backbone.trigger('layout:portfolioDashboard', options.model, options.collection);
    },

    portfolio: function(options){
      Backbone.trigger('layout:portfolioDetail', options.model, options.collection);
      this.currentState = 'portfolio';
    },

    select_project: function(id){
      this.project({model: ia.allProjects.get(id)});
    },

    project: function(options){
      Backbone.trigger('layout:projectDetail', options.model);
      this.currentState = 'project';
    },

    initialize: function(){
      var that = this;

      this.layoutController = new Layouts.Controller(ia);
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
