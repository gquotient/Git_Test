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

    onClose: function(){
      this.options.settingsRegion.close();
    },

    buildSettingsDropdown: function(){
      var that = this;

      var settingsDropdown = new Marionette.ItemView({
        tagName: 'li',
        className: 'menu dropdown',
        template: _.template('<ul><li><a href="#dashboard" class="viewDashboard">Operator Dashboard</a></li></ul>'),
        onViewDashboard: function(){
          console.log('view dashboard');
        },
        events: {
          'click .viewDashboard': function(event){
            event.preventDefault();
            Backbone.history.navigate('/portfolio/dashboard/' + that.model.id, true);
          }
        }
      });

      //Create settings view
      this.options.settingsRegion.show(settingsDropdown);
    },

    selectPortfolio: function(portfolio) {
      this.model = portfolio;
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

      // Build KPIs
      var kpis = new Portfolio.views.AggregateKpis({ model: portfolio });
      this.kpis.show(kpis);

      // Update the collection.
      this.projectList.set(portfolio.projects.models);
      Backbone.trigger('set:breadcrumbs', {model: portfolio, state: 'portfolio', display_name: portfolio.get('display_name')});

      // Update active item
      this.portfolioNavigationListView.setActive(portfolio.id);

      // Update Map View
      this.mapView.fitToBounds();
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
