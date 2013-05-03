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

    portfolioDetail: function(id){
      var portfolio = ia.getPortfolio(id);

      if (this.contentLayout instanceof PortfolioDetailLayout) {
        Backbone.trigger('select:portfolio', portfolio);
      } else {
        // Special Breadcrumb handling
        if (this.contentLayout instanceof ProjectDetailLayout) {
          Backbone.trigger('set:breadcrumbs', portfolio);
        } else {
          Backbone.trigger('reset:breadcrumbs', portfolio);
        }

        this.contentLayout = new PortfolioDetailLayout({model: portfolio});
        this.mainLayout.mainContent.show(this.contentLayout);
      }
    },

    portfolioDashboard: function(id){
      var portfolio = ia.getPortfolio(id);

      Backbone.trigger('reset:breadcrumbs', portfolio);

      this.contentLayout = new PortfolioDashboardLayout({model: portfolio});
      this.mainLayout.mainContent.show(this.contentLayout);
    },

    projectDetail: function(id){
      var project = ia.getProject(id);

      Backbone.trigger('set:breadcrumbs', project);

      this.contentLayout = new ProjectDetailLayout({model: project});
      this.mainLayout.mainContent.show(this.contentLayout);
    },

    profile: function(){
      Backbone.trigger('reset:breadcrumbs', {name: 'Profile'});

      this.contentLayout = new ProfileLayout( {model: ia.currentUser });
      this.mainLayout.mainContent.show(this.contentLayout);
    },

    admin: function(page){
      Backbone.trigger('reset:breadcrumbs', {name: 'Admin'});

      this.contentLayout = new AdminLayout({initialView: page});
      this.mainLayout.mainContent.show(this.contentLayout);
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
      'portfolio/:id': 'portfolioDetail',
      'portfolio/dashboard': 'portfolioDashboard',
      'portfolio/dashboard/:id': 'portfolioDashboard',
      'project/:id': 'projectDetail',
      'profile': 'profile',
      'admin': 'admin',
      'admin/:page': 'admin'
    }
  });

  return Router;
});
