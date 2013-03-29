define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'portfolio',
  'project',

  'hbs!layouts/templates/detailOverview'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Portfolio,
  Project,
  detailOverviewTemplate
){
  var Layouts = {};

  Layouts.detailOverview = Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: detailOverviewTemplate
    },
    regions: {
      //header: '#detail_header',
      kpis: '#kpis',
      map: '#map_view',
      //alarms: '#alarms',
      projects: '#projects'
    },
    initialize: function(options){
      var that = this;

      this.controller = options.controller;

      this.listenTo(this.controller, 'set:portfolio', function(portfolio){
        /*
        var header = new Portfolio.views.detailHeader({model: portfolio});
        that.header.show(header);
        */
        var kpisView = new Portfolio.views.detailKpis({ model: portfolio});
        that.kpis.show(kpisView);

        var projects;

        if (portfolio) {
          projects = new Project.collections.DataList(options.projectList.filterByIDs(portfolio.getAllProjects()));
        } else {
          projects = options.projectList;
        }

        var projectList = new Project.views.DataList({ collection: projects });
        that.projects.show(projectList);

        // Check if map already exists - maybe there's a better way to do this
        if(!$('#leafletContainer').length){
          var map = new Portfolio.views.map();
          this.map.show(map);
          map.build();
        }else{
          // Pan and scan the map
        }
      });
    }
  });

  return Layouts;
});
