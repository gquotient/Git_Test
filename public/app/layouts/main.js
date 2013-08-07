define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'message',

  'layouts/header',
  'layouts/navigation',
  'layouts/portfolioDetail',
  'layouts/projectDetail',
  'layouts/issues',
  'layouts/devices',
  'layouts/portfolioDashboard',
  'layouts/projectEditor',
  'layouts/profile',
  'layouts/admin',

  'hbs!layouts/templates/index'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  Message,

  Header,
  Navigation,
  PortfolioDetailLayout,
  ProjectDetailLayout,
  IssuesLayout,
  DevicesLayout,
  PortfolioDashboardLayout,
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
      var portfolio = this.app.allPortfolio;

      this.header.show(this.headerView);
      this.breadcrumbs.show(this.navigationView);

      Backbone.trigger('set:breadcrumbs', {
        state: 'portfolio',
        display_name: portfolio.get('display_name'),
        model: portfolio
      });
    },

    showPortfolio: function(portfolio){
      this.activePortfolio = portfolio;

      this.mainContent.show( new PortfolioDetailLayout({
        model: portfolio,
        portfolios: this.app.portfolios,
        settingsRegion: this.pageSettings
      }));
    },

    showPortfolioDashboard: function(portfolio){
      this.mainContent.show( new PortfolioDashboardLayout({
        model: portfolio,
        portfolios: this.app.portfolios
      }));
    },

    showProject: function(project){
      this.mainContent.show( new ProjectDetailLayout({
        model: project,
        collection: this.activePortfolio.projects,
        equipment: this.app.equipment,
        settingsRegion: this.pageSettings
      }));
    },

    showProjectEditor: function(id, options){
      this.mainContent.show( new ProjectEditorLayout(_.extend({
        model: this.app.alignedProjects.getOrCreate(id),
        equipment: this.app.equipment,
        user: this.app.currentUser
      }, options)));
    },

    showProjectIssues: function(project, issueId){
      Backbone.trigger('set:breadcrumbs', {
        state: 'project',
        display_name: project.get('display_name'),
        model: project
      });

      this.mainContent.show( new IssuesLayout({
        model: project,
        currentIssue: issueId,
        app: this.app
      }));
    },

    showProjectDevices: function(project, deviceId){
      Backbone.trigger('set:breadcrumbs', {
        state: 'project',
        display_name: project.get('display_name'),
        model: project
      });

      this.mainContent.show( new DevicesLayout({
        model: project,
        currentDevice: deviceId
      }));
    },

    showProfile: function(){
      this.mainContent.show( new ProfileLayout({
        model: this.app.currentUser
      }));
    },

    showAdmin: function(page, detail){
      var adminLayout = new AdminLayout({
        currentUser: this.app.currentUser
      });

      this.mainContent.show(
        adminLayout
      );

      return adminLayout;
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
          that.app.portfolios.fetch().done(function(portfolios){
            var myPortfolio = that.app.portfolios.findWhere({label: 'ALL'});

            Backbone.trigger('select:portfolio', myPortfolio);
          });

          // Once more APIs are implemented, we can make sure everything else syncs up with the team.
        }
      });
    },

    toggleNotificationBanner: function(){
      var notification = new Message.views.notificationBanner({parentRegion: this.banner});

      this.banner.show(notification);

      notification.on('close', function(){
        $('#page').removeClass('withBanner');
      });
    },

    initialize: function(options){
      this.app = options.app;

      this.activePortfolio = this.app.allPortfolio;

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
