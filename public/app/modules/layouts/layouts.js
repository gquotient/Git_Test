define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'portfolio',
  'project',

  'hbs!app/layouts/index',
  'hbs!layouts/templates/detailOverview'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Portfolio,
  Project,
  indexTemplate,
  detailOverviewTemplate
){
  var Layouts = {};

  Layouts.Main = Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: indexTemplate
    },
    regions: {
      header: '#header',
      navigation: '#navigation',
      pageNavigation: '#nav_page',
      contentNavigation: '#nav_content',
      mainContent: '#content'
    },
    onRender: function(){
      // This is almost useless sense render will have fire before the elements are added to the DOM
      this.resize();
    },
    resize: function(){
      // Set wrapper container to fill the window
      var $content = this.$el.find('.contentContainer'),
      myOffset = $content.offset();

      // Window height minus offset is the easy way to _fill the rest_ of the window
      $content.height($(window).height() - myOffset.top);
    },
    initialize: function(){
      var that = this;

      // Listen for global window resize trigger and fire resize method
      this.listenTo(Backbone, 'windowResize', function(event){
        that.resize();
      });
    }
  });

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
          projects = new Project.collections.DataList(options.projectList.filterByIDs( portfolio.get('allProjectIDs') ));
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
