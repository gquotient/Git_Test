define([
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'message',

  'layouts/header',
  'layouts/navigation',
  'layouts/portfolioDetail',
  'layouts/projectDetail',
  'layouts/projectIssues',
  'layouts/projectDevices',
  'layouts/portfolioDashboard',
  'layouts/projectCreator',
  'layouts/projectEditor',
  'layouts/profile',
  'layouts/admin',

  'hbs!layouts/templates/index'
], function(
  $,
  Backbone,
  Marionette,
  Handlebars,

  Message,

  Header,
  Navigation,
  PortfolioDetailLayout,
  ProjectDetailLayout,
  ProjectIssuesLayout,
  ProjectDevicesLayout,
  PortfolioDashboardLayout,
  ProjectCreatorLayout,
  ProjectEditorLayout,
  ProfileLayout,
  AdminLayout,

  indexTemplate
){
  // MAIN LAYOUT/CONTROLLER
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: indexTemplate
    },

    regions: {
      header: '#header',
      banner: '.banner',
      navigation: '.nav_page',
      breadcrumbs: '.breadcrumbs',
      pageSettings: '#pageSettings',
      mainContent: '#page'
    },

    onShow: function(){
      this.header.show(this.headerView);
      this.breadcrumbs.show(this.navigationView);
      var allPortfolio = this.app.portfolios.findWhere({label: 'ALL'});
      Backbone.trigger('set:breadcrumbs', { model: allPortfolio, state: 'portfolio', display_name: allPortfolio.get('display_name')});
    },

    showPortfolio: function(portfolio){
      this.activePortfolio = portfolio;

      var contentLayout = new PortfolioDetailLayout({model: portfolio, portfolios: this.app.portfolios, settingsRegion: this.pageSettings});
      this.mainContent.show(contentLayout);
    },

    showPortfolioDashboard: function(portfolio){
      var contentLayout = new PortfolioDashboardLayout({model: portfolio, app: this.app});
      this.mainContent.show(contentLayout);
    },

    showProject: function(project){
      var contentLayout = new ProjectDetailLayout({model: project, collection: this.activePortfolio.projects, settingsRegion: this.pageSettings});
      this.mainContent.show(contentLayout);
    },

    showProjectCreate: function(){
      this.mainContent.show(new ProjectCreatorLayout());
    },

    showProjectEdit: function(project){
      var contentLayout = new ProjectEditorLayout({model: project});
      this.mainContent.show(contentLayout);
    },

    showProjectIssues: function(project, issue){
      Backbone.trigger('set:breadcrumbs', {model: project, state: 'project', display_name: project.get('display_name')});
      var issueLayout = new ProjectIssuesLayout({model: project, currentIssue: issue, app: this.app});
      this.mainContent.show(issueLayout);
    },

    showProjectDevices: function(project, deviceId){
      Backbone.trigger('set:breadcrumbs', {model: project, state: 'project', display_name: project.get('display_name')});
      var deviceLayout = new ProjectDevicesLayout({model: project, currentDevice: deviceId});
      this.mainContent.show(deviceLayout);
    },

    showProfile: function(){
      var contentLayout = new ProfileLayout({ model: this.app.currentUser });
      this.mainContent.show(contentLayout);
    },

    showAdmin: function(page, detail){
      var contentLayout = new AdminLayout({ initialView: page, currentUser: this.app.currentUser });
      this.mainContent.show(contentLayout);

    },

    switchTeam: function(teamLabel){
      var that = this;
      this.app.currentTeam = teamLabel;
      $.ajax('/api/teams/current', {
        type: 'PUT',
        data: {
          team_label: teamLabel
        },
        success: function(){
          that.app.portfolios.fetch();

          // Once more APIs are implemented, we can make sure everything else syncs up with the team.
        }
      });
    },

    toggleNotificationBanner: function(){
      var
        that = this,
        notification = new Message.views.notificationBanner({parentRegion: this.banner})
      ;

      this.banner.show(notification);

      notification.on('close', function(){
        $('#page').removeClass('withBanner');
      });
    },

    initialize: function(options){
      var that = this;
      this.app = options.app;

      this.activePortfolio = this.app.portfolios.findWhere({label: 'ALL'});
      // Build header
      this.headerView = new Header({model: options.currentUser});

      // Build navigation
      this.navigationView = new Navigation({app: this.app});

      this.listenTo(Backbone, 'click:portfolio', function(model){
        this.activePortfolio = model;
      });

      this.listenTo(Backbone, 'select:portfolio', function(model){
        Backbone.history.navigate('/portfolio/' + model.id);
        this.showPortfolio(model);
      }, this);

      this.listenTo(Backbone, 'select:project', function(model){
        Backbone.history.navigate('/project/' + model.id);
        this.showProject(model, this.activePortfolio.projects);
      }, this);

      // Special page settings handling
      this.pageSettings.on('show', function(){
        this.$el.addClass('active');
      });

      this.pageSettings.on('close', function(){
        this.$el.removeClass('active');
      });

      // Special notification banner handling
      this.banner.on('show', function(){
        $('#page').addClass('withBanner');
      });

      this.banner.on('close', function(){
        $('#page').removeClass('withBanner');
      });

      this.listenTo(Backbone, 'select:team', function(teamLabel){
        this.switchTeam(teamLabel);
      });
    }
  });
});
