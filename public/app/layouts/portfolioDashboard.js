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
      this.dashboard.show(this.dashboardView);
      this.contentNavigation.show(this.portfolioNavigationListView);
    },

    initialize: function(options){
      var portfolio = options.model;

      Backbone.trigger('set:breadcrumbs', {model: portfolio, state: 'portfolioDashboard', display_name: portfolio.get('display_name')});

      if (this.currentState !== 'portfolioDashboard') {

        this.projectList = options.model.projects.clone();

        // Build primary portfolio nav
        this.portfolioNavigationListView = new Portfolio.views.NavigationListView({
          collection: options.app.portfolios
        });

        this.dashboardView = new Project.views.Dashboard({ collection: this.projectList });

        this.listenTo(Backbone, 'click:portfolio', function(model){
          // Update the collection.
          this.projectList.set(model.projects.models);
        });

      } else {
        // Trigger select event - We may want to pull global event
        // listening out of the modules
        Backbone.trigger('select:portfolio', options.model);
      }

      this.listenTo(Backbone, 'select:portfolio', function(model){
        // Set address bar
        Backbone.history.navigate('/portfolio/dashboard/' + model.id);
      });
    }
  });
});
