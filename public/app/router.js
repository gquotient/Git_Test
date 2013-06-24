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
  'layouts/projectDevices',
  'layouts/projectIssues',
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
  ProjectDevicesLayout,
  ProjectIssuesLayout,
  ProfileLayout,
  AdminLayout
){
  var RouteController = Backbone.Marionette.Controller.extend({
    index: function(){
      Backbone.history.navigate('portfolio/all', true);
    },

    findPortfolio: function(id){
      if (!id || id === 'all') {
        return ia.portfolios.findWhere({label: 'ALL'});
      } else {
        return ia.portfolios.get(id);
      }
    },

    portfolioDashboard: function(id){
      var portfolio = this.findPortfolio(id);

      Backbone.trigger('set:breadcrumbs', {model: portfolio, state: 'portfolioDashboard'});

      this.contentLayout = new PortfolioDashboardLayout({model: portfolio, app: ia});
      this.mainLayout.mainContent.show(this.contentLayout);
    },

    portfolioDetail: function(id){
      var portfolio = this.findPortfolio(id);
      this.mainLayout.showPortfolio(portfolio);
    },

    findProject: function(id){
      return ia.projects.get(id);
    },

    projectCreate: function(){
      this.contentLayout = new ProjectCreatorLayout();
      this.mainLayout.mainContent.show(this.contentLayout);
    },

    projectEdit: function(id){
      var project = this.findProject(id);

      if (!project) {
        ia.projects.add({label: id});
        project = ia.projects.get(id);
      }

      if (project) {
        this.contentLayout = new ProjectEditorLayout({model: project});
        this.mainLayout.mainContent.show(this.contentLayout);
      }
    },

    projectDetail: function(id){
      var project = this.findProject(id);
      this.mainLayout.showProject(project, ia.projects);
    },

    projectDevices: function(id, deviceId){
      var project = this.findProject(id);

      this.contentLayout = new ProjectDevicesLayout({model: project, currentDevice: deviceId});
      this.mainLayout.mainContent.show(this.contentLayout);
    },

    projectIssues: function(id, issueId){
      var project = this.findProject(id);

      console.log(project);

      this.contentLayout = new ProjectIssuesLayout({model: project, currentIssue: issueId});
      this.mainLayout.mainContent.show(this.contentLayout);
    },

    profile: function(){
      Backbone.trigger('set:breadcrumbs', {model: {display_name: 'Profile'}, state: 'profile' });

      this.contentLayout = new ProfileLayout( {model: ia.currentUser });
      this.mainLayout.mainContent.show(this.contentLayout);
    },

    admin: function(page, detail){
      Backbone.trigger('reset:breadcrumbs', {name: 'Admin'});

      this.contentLayout = new AdminLayout({ initialView: page, currentUser: ia.currentUser });
      this.mainLayout.mainContent.show(this.contentLayout);
    },

    initialize: function(){
      this.mainLayout = new MainLayout({currentUser: ia.currentUser, app: ia});
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
      'project/:id/devices': 'projectDevices',
      'project/:id/devices/:deviceId': 'projectDevices',
      'project/:id/issues': 'projectIssues',
      'project/:id/issues/:issueId': 'projectIssues',

      'profile': 'profile',

      //Admin Routes
      'admin': 'admin',
      'admin/:page': 'admin'
    }
  });

  return Router;
});
