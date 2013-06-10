define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'ia',

  'layouts/helpers',
  'layouts/main',
  'layouts/portfolioDashboard',
  'layouts/portfolioDetail',
  'layouts/projectCreator',
  'layouts/projectEditor',
  'layouts/projectDetail',
  'layouts/profile',
  'layouts/admin'
], function(
  $,
  _,
  Backbone,
  Marionette,

  ia,

  Helpers,
  MainLayout,
  PortfolioDashboardLayout,
  PortfolioDetailLayout,
  ProjectCreatorLayout,
  ProjectEditorLayout,
  ProjectDetailLayout,
  ProfileLayout,
  AdminLayout
){
  var RouteController = Backbone.Marionette.Controller.extend({
    index: function(){
      Backbone.history.navigate('portfolio/all', true);
    },

    findPortfolio: function(id){
      if (!id || id === 'all') {
        return ia.rootPortfolio;
      } else {
        return ia.rootPortfolio.portfolios.get(id);
      }
    },

    portfolioDashboard: function(id){
      var portfolio = this.findPortfolio(id);

      Backbone.trigger('reset:breadcrumbs', portfolio);

      this.contentLayout = new PortfolioDashboardLayout({model: portfolio});
      this.mainLayout.mainContent.show(this.contentLayout);
    },

    portfolioDetail: function(id){
      var portfolio = this.findPortfolio(id);

      if (this.contentLayout instanceof PortfolioDetailLayout) {
        // If already on the portfolio view we just want to update
        // the subviews
        Backbone.trigger('select:portfolio', portfolio);
      } else {
        // Special Breadcrumb handling
        if (this.contentLayout instanceof ProjectDetailLayout) {
          // If we hit portfolio from project we don't want to reset
          // breadcrumbs, just update them
          Backbone.trigger('set:breadcrumbs', portfolio);
        } else {
          Backbone.trigger('reset:breadcrumbs', portfolio);
        }

        // Build portfolio view
        this.contentLayout = new PortfolioDetailLayout({model: portfolio});
        this.mainLayout.mainContent.show(this.contentLayout);
      }
    },

    findProject: function(id){
      return ia.rootPortfolio.projects.get(id);
    },

    projectCreate: function(){
      Backbone.trigger('reset:breadcrumbs', {name: 'Project Creator'});

      this.contentLayout = new ProjectCreatorLayout();
      this.mainLayout.mainContent.show(this.contentLayout);
    },

    projectEdit: function(id){
      var project = this.findProject(id);

      if (project) {
        Backbone.trigger('set:breadcrumbs', {name: 'Edit'});

        this.contentLayout = new ProjectEditorLayout({model: project});
        this.mainLayout.mainContent.show(this.contentLayout);
      }
    },

    projectDetail: function(id){
      var project = this.findProject(id);

      if (project) {
        Backbone.trigger('set:breadcrumbs', project);

        this.contentLayout = new ProjectDetailLayout({model: project});
        this.mainLayout.mainContent.show(this.contentLayout);
      }
    },

    profile: function(){
      Backbone.trigger('reset:breadcrumbs', {name: 'Profile'});

      this.contentLayout = new ProfileLayout( {model: ia.currentUser });
      this.mainLayout.mainContent.show(this.contentLayout);
    },

    admin: function(page, detail){
      Backbone.trigger('reset:breadcrumbs', {name: 'Admin'});

      this.contentLayout = new AdminLayout({ initialView: page, app: ia });
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

      'portfolio/dashboard/:id': 'portfolioDashboard',
      'portfolio/dashboard': 'portfolioDashboard',
      'portfolio/:id': 'portfolioDetail',
      'portfolio': 'index',

      'project/create': 'projectCreate',
      'project/:id/edit': 'projectEdit',
      'project/:id': 'projectDetail',

      'profile': 'profile',

      //Admin Routes
      'admin': 'admin',
      'admin/:page': 'admin'
    }
  });

  return Router;
});
