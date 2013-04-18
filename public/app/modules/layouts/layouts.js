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
  'hbs!layouts/templates/projectDetail',

  'hbs!layouts/templates/portfolioDashboard'
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
  projectDetailTemplate,
  portfolioDashboardTemplate
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

  Handlebars.registerHelper('percent', function(value, max){
    return value/max * 100;
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
      //contentNavigation: '#nav_content',
      mainContent: '#page'
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
      this.listenTo(Backbone, 'window:resize', function(event){
        that.resize();
      });
    }
  });

  Layouts.PortfolioDetail = Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: portfolioDetailTemplate
    },
    attributes: {
      class: 'portfolioView'
    },
    regions: {
      kpis: '#kpis',
      map: '#map',
      projects: '#projects',
      contentNavigation: '#nav_content'
    },
    initialize: function(){

    }
  });

  Layouts.ProjectDetail = Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: projectDetailTemplate
    },
    attributes: {
      class: 'projectView'
    },
    regions: {
      map: '#map',
      kpis: '#kpis',
      alarms: '#alarms'
    },
    initialize: function(){

    }
  });

  Layouts.PortfolioDashboard = Backbone.Marionette.Layout.extend({
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
    }
  })

  return Layouts;
});
