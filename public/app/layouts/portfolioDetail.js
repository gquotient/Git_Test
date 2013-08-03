define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',

  'hbs!layouts/templates/portfolioDetail'
], function(
  _,
  $,
  Backbone,
  Marionette,
  Handlebars,

  Portfolio,
  Project,

  portfolioDetailTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: portfolioDetailTemplate
    },
    attributes: {
      id: 'page-portfolioDetail'
    },
    regions: {
      kpis: '#kpis',
      map: '#map',
      projects: '#projects',
      contentNavigation: '.nav_content'
    },

    onShow: function(){
      // Poulate detail layout
      this.contentNavigation.show(this.portfolioNavigationListView);
      this.projects.show(this.projectTable);
      this.map.show(this.mapView);

      this.buildSettingsDropdown();

      // Select context
      this.selectPortfolio(this.options.model);
    },

    buildSettingsDropdown: function(){
      var that = this;

      //Create settings view
      this.settings = new Marionette.ItemView({
        tagName: 'ul',
        template: _.template('<li><a href="#" class="edit">Operator Dashboard</a></li>')
      });

      //Show ItemView in cached region
      this.options.settingsRegion.show(this.settings);

      //Define listeners
      this.options.settingsRegion.$el.find('.edit').on('click', function(event){
        event.preventDefault();

        //Navigate to edit view
        Backbone.history.navigate('/portfolio/dashboard/' + that.model.id, true);
      });
    },

    selectPortfolio: function(model) {
      // Clear existing interval
      // NOTE - I'm not sure how necessary this is
      if (this.fetchIssuesInterval) {
        clearInterval(this.fetchIssuesInterval);
      }

      // Fetch issues on the new portfolio
      var fetchIssues = function(){
        model.fetchIssues();
      };

      // Run initially to get latest data
      fetchIssues();

      // Fetch issues every five minutes
      this.fetchIssuesInterval = setInterval(fetchIssues, 300000);

      // Build KPIs
      var kpis = new Portfolio.views.AggregateKpis({ model: model });
      this.kpis.show(kpis);

      // Update the collection.
      this.projectList.set(model.projects.models);
      Backbone.trigger('set:breadcrumbs', {model: model, state: 'portfolio', display_name: model.get('display_name')});

      // Update active item
      this.portfolioNavigationListView.setActive(this.model.id);
    },

    initialize: function(options){
      // Build primary portfolio nav
      this.portfolioNavigationListView = new Portfolio.views.NavigationListView({
        collection: options.portfolios
      });

      // Init shared project collection
      this.projectList = new Project.Collection(options.model.projects.models);

      // Extend map view for marker filtering
      this.mapView = new Project.views.Map({ collection: this.projectList });

      // Init project table
      this.projectTable = new Project.views.DataListView({
        collection: this.projectList
      });

      this.listenTo(Backbone, 'click:portfolio', function(model){
        this.selectPortfolio(model);

        Backbone.history.navigate('/portfolio/' + model.id);
      });
    }
  });
});
