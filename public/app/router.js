define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'ia',

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
    getPortfolioById: function(id){
      if (!id || id === 'all') {
        return ia.rootPortfolio;
      } else {
        return ia.getPortfolio(id);
      }
    },

    portfolioDashboard: function(id){
      var portfolio = this.getPortfolioById(id);

      Backbone.trigger('set:breadcrumbs', portfolio);
      this.mainLayout.mainContent.show(
        new PortfolioDashboardLayout({model: portfolio})
      );
    },

    portfolio: function(id){
      var portfolio = this.getPortfolioById(id);

      // Build detail view if not currently there
      // NOTE: this is a hack for better back/forward support
      if (!$('.portfolioDetail').length) {
        Backbone.trigger('set:breadcrumbs', portfolio);
        this.mainLayout.mainContent.show(
          new PortfolioDetailLayout({model: portfolio})
        );
      } else {
        // Trigger select event
        Backbone.trigger('select:portfolio', portfolio);
      }
    },

    project: function(id){
      var project = ia.getProject(id);

      Backbone.trigger('set:breadcrumbs', project);
      this.mainLayout.mainContent.show( new ProjectDetailLayout({model: project}) );
    },

    profile: function(){
      Backbone.trigger('reset:breadcrumbs', {name: 'My Profile'});
      this.mainLayout.mainContent.show( new ProfileLayout( {model: ia.currentUser }));
    },

    admin: function(page){
      Backbone.trigger('reset:breadcrumbs', {name: 'Admin'});
      this.mainLayout.mainContent.show( new AdminLayout({initialView: page}) );
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
      'admin': 'admin',
      'admin/:page': 'admin'
    }
  });

  return Router;
});
