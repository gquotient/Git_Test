define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',

  'hbs!layouts/portfolios/templates/detail'
], function(
  _,
  $,
  Backbone,
  Marionette,
  Handlebars,

  Portfolio,
  Project,

  detailTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: detailTemplate
    },
    regions: {
      kpis: '#kpis',
      map: '#map',
      projects: '#projects'
    },
    initialize: function(options){
      // Init shared project collection
      this.projectList = options.model.projects;

      // Extend map view for marker filtering
      this.mapView = new Project.views.Map({ collection: this.projectList });

      // Init project table
      this.projectTable = new Project.views.DataListView({
        collection: this.projectList
      });
    },
    onShow: function(){
      var portfolio = this.model;

      // Poulate detail layout
      this.projects.show(this.projectTable);
      this.map.show(this.mapView);

      // Fetch data for all projects
      // This is necessary for dynamic project property portfolios
      var fetchProjectData = function(){
        portfolio.collection.projects.fetchIssues();
        portfolio.collection.projects.fetchProjectKpis();
      };

      // Run initially to get latest data
      fetchProjectData();

      // Fetch issues every five minutes
      this.fetchIssuesInterval = setInterval(fetchProjectData, 300000);

      // Build KPIs
      var kpis = new Portfolio.views.AggregateKpis({ model: portfolio });
      this.kpis.show(kpis);

      // Update Map View
      this.mapView.fitToBounds();

      // Listen for changes to portfolio projects and update projectList
      this.listenTo(this.model.projects, 'add', function(){
        this.projectList.set(portfolio.projects.models);
      });
    }
  });
});