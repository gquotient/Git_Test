define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'ia',

  'layouts/helpers',
  'layouts/main'
], function(
  $,
  _,
  Backbone,
  Marionette,

  ia,

  Helpers,
  MainLayout

){
  var RouteController = Backbone.Marionette.Controller.extend({
    index: function(){
      Backbone.history.navigate('portfolio/all', true);
    },

    findPortfolio: function(id){
      return ia.portfolios.get(id) || ia.allPortfolio;
    },

    portfolioDashboard: function(id){
      var portfolio = this.findPortfolio(id);
      this.mainLayout.showPortfolioDashboard(portfolio);
    },

    portfolioDetail: function(id){
      var portfolio = this.findPortfolio(id);

      Backbone.trigger('reset:breadcrumbs', {
        state: 'portfolio',
        display_name: portfolio.get('display_name'),
        model: portfolio
      });

      this.mainLayout.showPortfolio(portfolio);
    },

    findProject: function(id){
      return ia.projects.get(id);
    },

    projectCreate: function(){
      this.mainLayout.showProjectCreate();
    },

    projectEdit: function(id){
      var project = this.findProject(id);
      this.mainLayout.showProjectEdit(project || id);
    },

    projectDetail: function(id){
      var project = this.findProject(id);
      this.mainLayout.showProject(project);
    },

    projectDevices: function(id, deviceId){
      var project = this.findProject(id);
      this.mainLayout.showProjectDevices(project, deviceId);
    },

    projectIssues: function(id, issueId){
      var project = this.findProject(id);
      this.mainLayout.showProjectIssues(project, issueId);
    },

    profile: function(){
      this.mainLayout.showProfile();
    },

    admin: function(){
      this.userAdmin();
    },

    userAdmin: function(){
      this.mainLayout.showAdmin().showUsers();
    },

    teamAdmin: function(){
      this.mainLayout.showAdmin().showTeams();
    },

    alarmAdmin: function(){
      this.mainLayout.showAdmin().showAlarms();
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
