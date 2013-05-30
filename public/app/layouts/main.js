define([
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

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
      navigation: '#nav_page',
      mainContent: '#page'
    },

    onShow: function(){
      this.header.show(this.headerView);
      this.navigation.show(this.navigationView);
    },

    showPortfolio: function(portfolio){
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
        var contentLayout = new PortfolioDetailLayout({model: portfolio});
        this.mainContent.show(contentLayout);
      }
    },

    showProject: function(project){
      Backbone.trigger('set:breadcrumbs', project);

      var contentLayout = new ProjectDetailLayout({model: project});
      this.mainContent.show(contentLayout);
    },

    initialize: function(app){
      var that = this;
      this.app = app;

      // Build header
      this.headerView = new Header({model: app.currentUser});

      // Build navigation
      this.navigationView = new Navigation();

      this.listenTo(Backbone, 'select:project', function(model){
        // Set address bar and force routing
        Backbone.history.navigate('/project/' + model.id);
        that.showProject(model);
      });

      // Set up listeners
      this.listenTo(Backbone, 'select:portfolio', function(model){
        // Set address bar
        Backbone.history.navigate('/portfolio/' + model.id);
        that.showPortfolio(model);
      });
    }
  });
});
