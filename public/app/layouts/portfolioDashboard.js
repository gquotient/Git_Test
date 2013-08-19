define([
  'backbone',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',

  'hbs!layouts/templates/portfolioDashboard'
], function(
  Backbone,
  Marionette,
  Handlebars,

  Portfolio,
  Project,

  portfolioDashboardTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: portfolioDashboardTemplate
    },
    attributes: {
      id: 'page-portfolioDashboard'
    },
    regions: {
      dashboard: '#dashboard',
      contentNavigation: '.nav_content'
    },

    onShow: function(){
      this.contentNavigation.show(this.portfolioNavigationListView);
      this.dashboard.show(this.dashboardView);

      this.setPortfolio(this.options.model);
    },

    setPortfolio: function(portfolio){
      Backbone.history.navigate('/portfolio/dashboard/' + portfolio.id);

      // Clear existing interval
      // NOTE - I'm not sure how necessary this is
      if (this.fetchIssuesInterval) {
        clearInterval(this.fetchIssuesInterval);
      }

      // Fetch issues on the new portfolio
      var fetchProjectData = function(){
        portfolio.projects.fetchIssues();
        portfolio.projects.fetchProjectKpis();
      };

      // Run initially to get latest data
      fetchProjectData();

      // Fetch issues every five minutes
      this.fetchIssuesInterval = setInterval(fetchProjectData, 300000);

      Backbone.trigger('set:breadcrumbs', {model: portfolio, state: 'portfolioDashboard', display_name: portfolio.get('display_name') + ' Dashboard'});

      // Update the collection.
      this.projectList.set(portfolio.projects.models);

      // Update active item
      this.portfolioNavigationListView.setActive(portfolio.id);
    },

    initialize: function(options){
      var portfolio = options.model;

      // Build primary portfolio nav
      this.portfolioNavigationListView = new Portfolio.views.NavigationListView({
        collection: options.portfolios
      });

      this.projectList = new Project.Collection();

      this.dashboardView = new Project.views.Dashboard({collection: this.projectList});

      this.listenTo(Backbone, 'click:portfolio', function(model){
        this.setPortfolio(model);
      }, this);
    }
  });
});
