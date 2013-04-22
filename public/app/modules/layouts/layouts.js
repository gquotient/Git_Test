define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',

  'hbs!layouts/templates/index',
  'hbs!layouts/templates/header',
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
  headerTemplate,
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

  // MAIN LAYOUT

  Layouts.Main = Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: indexTemplate
    },
    regions: {
      header: '#header',
      //navigation: '#navigation',
      pageNavigation: '#nav_page',
      mainContent: '#page'
    }/*,
    onRender: function(){
      // This is almost useless since render will have fired before the elements are added to the DOM
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
    }*/
  });

  Layouts.Header = Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: headerTemplate
    },

    triggers: {
      "click .logout": "logout"
    }
  });

  // PORTFOLIO DETAIL LAYOUT

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
      this.listenTo(Backbone, 'select:project', function(model){
        Backbone.trigger('layout:projectDetail', model);
      });

      this.listenTo(Backbone, 'select', function(model){
        // Set address bar
        Backbone.history.navigate('/' + model.get('type') + '/' + model.get('id'));
      });
    }
  });

  // PROJECT DETAIL LAYOUT

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
      this.listenTo(Backbone, 'select:portfolio', function(model){
        Backbone.trigger('layout:portfolioDetail', model, model.get("subPortfolios"));
      });

      this.listenTo(Backbone, 'select', function(model){
        // Set address bar
        Backbone.history.navigate('/' + model.get('type') + '/' + model.get('id'));
      });
    }
  });

  // PORTFOLIO DASHBOARD LAYOUT

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
    },
    initialize: function(){
      this.listenTo(Backbone, 'select', function(model){
        // Set address bar
        Backbone.history.navigate('/' + model.get('type') + '/dashboard/' + model.get('id'));
      });
    }
  });

  // LAYOUT CONTROLLER

  Layouts.Controller = Backbone.Marionette.Controller.extend({
    currentState: '',

    portfolioDetail: function(model, collection){
      // Reset breadcrumbs
      var breadcrumbs = [this.app.allPortfoliosPortfolio];

      if (model !== this.app.allPortfoliosPortfolio) {
        breadcrumbs.push(model);
      }

      Backbone.trigger('set:breadcrumbs', breadcrumbs);

      // Build detail view if not currently there
      if (this.currentState !== 'portfolioDetail') {
        // Populate main layout
        var portfolioDetail = new Layouts.PortfolioDetail();

        this.app.layouts.app.mainContent.show(portfolioDetail);

        // Build detail view
        var
          // Build primary portfolio nav
          portfolioNavigationListView = new Portfolio.views.NavigationListView({
            collection: collection,
            model: model
          }),
          // Build KPIs
          kpisView = new Portfolio.views.detailKpis({ model: model }),

          projectList = model.get('projects').clone(),

          // Extend map view for marker filtering
          map = new Project.views.map({
            collection: projectList
          }),

          projectListView = new Project.views.DataListView({
            collection: projectList
          })
        ;

        portfolioDetail.listenTo(Backbone, 'select:portfolio', function(model){
          // Update the collection.
          projectList.set(model.get('projects').models);
        });

        // Poulate detail layout
        portfolioDetail.contentNavigation.show(portfolioNavigationListView);
        portfolioDetail.kpis.show(kpisView);
        portfolioDetail.projects.show(projectListView);
        portfolioDetail.map.show(map);

        this.currentState = 'portfolioDetail';
      } else {
        // Trigger select event - We may want to pull global event
        // listening out of the modules
        Backbone.trigger('select:portfolio', model);
      }
    },

    projectDetail: function(model){
      // Reset Breadcrumbs
      var breadcrumbs = [this.app.allPortfoliosPortfolio, model];

      Backbone.trigger('set:breadcrumbs', breadcrumbs);

      // Build detail view if not currently there
      if (this.currentState !== 'projectDetail') {
        // Populate main layout
        var projectDetail = new Layouts.ProjectDetail({model: model});
        this.app.layouts.app.mainContent.show(projectDetail);

        var map = new Project.views.map({
          collection: new Project.collections.Projects([model])
        });

        // Populate project detail view
        projectDetail.map.show(map);

        this.currentState = 'projectDetail';
      } else {
        // Trigger select event - We may want to pull global event
        // listening out of the modules
        Backbone.trigger('select:project', model);
      }
    },

    portfolioDashboard: function(model, collection){
      var breadcrumbs = [this.app.allPortfoliosPortfolio];
      Backbone.trigger('set:breadcrumbs', breadcrumbs);

      if (this.currentState !== 'portfolioDashboard') {
        var
          dashboardLayout = new Layouts.PortfolioDashboard(),
          projectList = model.get('projects').clone(),
          // Build primary portfolio nav
          portfolioNavigationListView = new Portfolio.views.NavigationListView({
            collection: collection,
            model: model
          }),
          dashboard = new Project.views.Dashboard({ collection: projectList })
        ;

        projectList.listenTo(Backbone, 'select:portfolio', function(model){
          // Update the collection.
          projectList.set(model.get('projects').models);
        });

        this.app.layouts.app.mainContent.show(dashboardLayout);
        dashboardLayout.dashboard.show(dashboard);
        dashboardLayout.contentNavigation.show(portfolioNavigationListView);

        this.currentState = 'portfolioDashboard';
      } else {
        // Trigger select event - We may want to pull global event
        // listening out of the modules
        Backbone.trigger('select:portfolio', model);
      }
    },

    initialize: function(app){
      this.app = app;
      this.listenTo(Backbone, 'layout:portfolioDetail', this.portfolioDetail);
      this.listenTo(Backbone, 'layout:projectDetail', this.projectDetail);
      this.listenTo(Backbone, 'layout:portfolioDashboard', this.portfolioDashboard);
    }
  });

  return Layouts;
});
