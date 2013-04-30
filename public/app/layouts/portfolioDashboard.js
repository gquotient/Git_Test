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
      class: 'portfolioDashboard'
    },
    regions: {
      dashboard: '#dashboard',
      contentNavigation: '#nav_content'
    },

    onShow: function(){
      this.dashboard.show(this.dashboardView);
      this.contentNavigation.show(this.portfolioNavigationListView);
    },

    initialize: function(options){
    //   this.stopListening();

      if (this.currentState !== 'portfolioDashboard') {

        this.projectList = options.model.get('projects').clone();
          // Build primary portfolio nav
        this.portfolioNavigationListView = new Portfolio.views.NavigationListView({
            collection: options.collection,
            model: options.model
          });
        this.dashboardView = new Project.views.Dashboard({ collection: this.projectList });

        this.listenTo(Backbone, 'select:portfolio', function(model){
          // Update the collection.
          this.projectList.set(model.get('projects').models);
        });

      } else {
        // Trigger select event - We may want to pull global event
        // listening out of the modules
        Backbone.trigger('select:portfolio', options.model);
      }

      this.listenTo(Backbone, 'select:portfolio', function(model){
        // Set address bar
        Backbone.history.navigate('/portfolio/dashboard/' + model.get('id'));
      });
    }
  });
});
