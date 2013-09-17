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

    operatorView: function(id){
      var portfolio = this.findPortfolio(id);
      this.mainLayout.showOperatorView(portfolio);
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

    alarmsAdmin: function(){
      this.mainLayout.showAdmin().showAlarms();
    },

    portfoliosAdmin: function(id){
      this.mainLayout.showAdmin().showPortfolios(id);
    },

    projectAdmin: function(id){
      this.mainLayout.showAdmin().showProject(id);
    },

    projectEditor: function(id, view){
      this.mainLayout.showProjectEditor(id, {
        view: view
      });
    },

    equipmentAdmin: function(id){
      this.mainLayout.showAdmin().showEquipment(id);
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

      'portfolio/operatorview/:id': 'operatorView',
      'portfolio/operatorview': 'operatorView',
      'portfolio/:id': 'portfolioDetail',
      'portfolio': 'index',

      'project/:id/devices/:deviceId': 'projectDevices',
      'project/:id/devices': 'projectDevices',
      'project/:id/issues/:issueId': 'projectIssues',
      'project/:id/issues': 'projectIssues',
      'project/:id': 'projectDetail',

      'profile': 'profile',

      //Admin Routes
      'admin/users': 'usersAdmin',

      'admin/teams/:id': 'teamAdminDetail',
      'admin/teams': 'teamsAdmin',

      'admin/portfolios/:id': 'portfoliosAdmin',
      'admin/portfolios': 'portfoliosAdmin',

      'admin/alarms': 'alarmsAdmin',

      'admin/projects/:id/:view': 'projectEditor',
      'admin/projects/:id': 'projectAdmin',
      'admin/projects': 'projectAdmin',

      'admin/equipment/:id': 'equipmentAdmin',
      'admin/equipment': 'equipmentAdmin',

      'admin': 'admin'
    }
  });

  return Router;
});
