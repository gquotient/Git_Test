define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',

  'portfolio',
  'project',

  'hbs!layouts/portfolios/templates/detail'
], function(
  _,
  $,
  Backbone,
  Marionette,

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
      Backbone.history.navigate('/portfolios/' + this.model.id);

      var portfolio = this.model;

      // Poulate detail layout
      this.projects.show(this.projectTable);
      this.map.show(this.mapView);

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
