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
      this.usersAdmin();
    },

    usersAdmin: function(){
      this.mainLayout.showAdmin().showUsers();
    },

    teamsAdmin: function(){
      this.mainLayout.showAdmin().showTeams();
    },

    teamAdminDetail: function(teamID){
      var teamLayout = this.mainLayout.showAdmin().showTeams();
      teamLayout.listenTo(teamLayout.collection, 'reset', function(){
        teamLayout.showTeam(teamLayout.collection.get(teamID));
      });
    },

    alarmAdmin: function(){
      // this.mainLayout.showAdmin().showAlarms();
    },

    projectAdmin: function(id){
      this.mainLayout.showAdmin().showProject(id);
    },

    projectAdminEdit: function(id, view){
      this.mainLayout.showProjectEditor(id, {
        editable: true,
        view: view
      });
    },

    projectAdminView: function(id, view){
      this.mainLayout.showProjectEditor(id, {
        editable: false,
        view: view
      });
    },

    portfoliosAdmin: function(){
      this.mainLayout.showAdmin().showPortfolios();
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

      'project/:id/devices/:deviceId': 'projectDevices',
      'project/:id/devices': 'projectDevices',
      'project/:id/issues/:issueId': 'projectIssues',
      'project/:id/issues': 'projectIssues',
      'project/:id': 'projectDetail',

      'profile': 'profile',

      //Admin Routes
      'admin': 'admin',
      'admin/users': 'usersAdmin',
      'admin/teams': 'teamsAdmin',
      'admin/teams/:id': 'teamAdminDetail',

      'admin/project/:id/edit/:view': 'projectAdminEdit',
      'admin/project/:id/edit': 'projectAdminEdit',
      'admin/project/:id/view/:view': 'projectAdminView',
      'admin/project/:id/view': 'projectAdminView',
      'admin/project/:id': 'projectAdmin',
      'admin/projects': 'projectAdmin',
      'admin/project': 'projectAdmin',

      'admin/portfolios': 'portfoliosAdmin'
    }
  });

  return Router;
});
