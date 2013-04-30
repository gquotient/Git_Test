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
],
function(
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

    portfolio_dashboard: function(id){
      var portfolios = this.getPortfoliosById(id);

      this.mainLayout.updateBreadcrumbs(portfolios.portfolio);
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
        this.mainLayout.updateBreadcrumbs(portfolios.portfolio);
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

      this.mainLayout.updateBreadcrumbs(project);
      this.mainLayout.mainContent.show( new ProjectDetailLayout({model: project}) );
    },

    profile: function(){
      this.mainLayout.updateBreadcrumbs({name: 'My Profile'}, true);
      this.mainLayout.mainContent.show( new ProfileLayout( {model: ia.currentUser }));
    },

    admin: function(page){
      console.log(page);
      this.mainLayout.updateBreadcrumbs({name: 'Admin'}, true);
      this.mainLayout.mainContent.show( new AdminLayout({initialView: page}) );
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
      'admin': 'admin',
      'admin/:page': 'admin'
    }
  });

  return Router;

});

