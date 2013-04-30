define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'ia',

  'portfolio',
  'project',

  'app/layouts/helpers',
  'app/layouts/main',
  'app/layouts/portfolioDetail',
  'app/layouts/projectDetail',
  'app/layouts/portfolioDashboard',
  'app/layouts/profile',
  'app/layouts/admin'
], function(
  $,
  _,
  Backbone,
  Marionette,

  ia,

  Portfolio,
  Project,

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

    // Utility function for getting portfolio model/collection
    getPortfoliosById: function(id){
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

      return {
        portfolio: portfolio,
        subPortfolios: subPortfolios
      };
    },

    portfolioDashboard: function(id){
      var portfolios = this.getPortfoliosById(id);

      Backbone.trigger('set:breadcrumbs', portfolios.portfolio);
      this.mainLayout.mainContent.show(
        new PortfolioDashboardLayout({
          model: portfolios.portfolio,
          collection: portfolios.subPortfolios
        })
      );
    },

    portfolio: function(id){
      var portfolios = this.getPortfoliosById(id);

      // Build detail view if not currently there
      // NOTE: this is a hack for better back/forward support
      if (!$('.portfolioDetail').length) {
        Backbone.trigger('set:breadcrumbs', portfolios.portfolio);
        this.mainLayout.mainContent.show(
          new PortfolioDetailLayout({
            model: portfolios.portfolio,
            collection: portfolios.subPortfolios
          })
        );
      } else {
        // Trigger select event
        Backbone.trigger('select:portfolio', portfolios.portfolio);
      }
    },

    project: function(id){
      var project = ia.allProjects.get(id);

      Backbone.trigger('set:breadcrumbs', project);
      this.mainLayout.mainContent.show( new ProjectDetailLayout({model: project}) );
    },

    profile: function(){
      Backbone.trigger('reset:breadcrumbs', {name: 'My Profile'});
      this.mainLayout.mainContent.show( new ProfileLayout( {model: ia.currentUser }));
    },

    admin: function(){
      Backbone.trigger('reset:breadcrumbs', {name: 'Admin'});
      this.mainLayout.mainContent.show( new AdminLayout({}) );
    },

    initialize: function(){
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
      'portfolio/dashboard': 'portfolioDashboard',
      'portfolio/dashboard/:id': 'portfolioDashboard',
      'project/:id': 'project',
      'profile': 'profile',
      'admin': 'admin'
    }
  });

  return Router;
});
