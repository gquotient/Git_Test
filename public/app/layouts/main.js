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

      Backbone.trigger('set:breadcrumbs', {model: this.app.rootPortfolio, state: 'portfolio'});
    },

    showPortfolio: function(portfolio){
      this.activePortfolio = portfolio;
      // Build portfolio view
      var contentLayout = new PortfolioDetailLayout({model: portfolio, portfolios: this.app.rootPortfolio.portfolios});
      this.mainContent.show(contentLayout);

      // Backbone.trigger('set:breadcrumbs', {model: portfolio, state: 'portfolio'});
      this.app.state = 'portfolio';
    },

    showProject: function(project){
      // Build project view
      var contentLayout = new ProjectDetailLayout({model: project, collection: this.activePortfolio.projects, settingsRegion: this.pageSettings});
      this.mainContent.show(contentLayout);

      // Backbone.trigger('set:breadcrumbs', {model: project, state: 'project'});
      this.app.state = 'project';
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
          that.app.rootPortfolio.portfolios.fetch();

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
      this.app.state = 'portfolio';
      this.activePortfolio = this.app.rootPortfolio;
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
      })
    }
  });
});
