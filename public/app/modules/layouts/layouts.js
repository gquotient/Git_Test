define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',

  'hbs!layouts/templates/index',
  'hbs!layouts/templates/portfolioDetail',
  'hbs!layouts/templates/projectDetail'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,
  Portfolio,
  Project,
  indexTemplate,
  portfolioDetailTemplate,
  projectDetailTemplate
){
  var Layouts = {};

  // Unit conversion
  var roundNumber = function(num, dec) {
    var result = (num !== null)?Math.round(num*Math.pow(10,dec))/Math.pow(10,dec):null;
    return result;
  };

  Handlebars.registerHelper('tokW', function(value) {
    return roundNumber((+value / 1000), 1);
  });

  Handlebars.registerHelper('toMW', function(value) {
    return roundNumber((+value / 1000000), 2);
  });

  // Layouts
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

  Layouts.PortfolioDetail = Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: portfolioDetailTemplate
    },
    regions: {
      //header: '#detail_header',
      kpis: '#kpis',
      map: '#map_view',
      //alarms: '#alarms',
      projects: '#projects'
    },
    initialize: function(){

    }
  });

  Layouts.ProjectDetail = Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: projectDetailTemplate
    },
    regions: {

    },
    initialize: function(){

    }
  });

  return Layouts;
});
