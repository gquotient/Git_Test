define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.virtualCollection',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',

  'layouts/portfolios/detail',
  'layouts/portfolios/operator',

  'hbs!layouts/templates/portfolios',
  'hbs!layouts/portfolios/templates/portfoliosSettings'
], function(
  _,
  $,
  Backbone,
  VirtualCollection,
  Marionette,
  Handlebars,

  Portfolio,
  Project,

  DetailLayout,
  OperatorLayout,

  portfoliosTemplate,
  portfoliosSettingsTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: portfoliosTemplate
    },
    attributes: {
      id: 'page-portfolios'
    },
    regions: {
      contentNavigation: '.nav_content',
      pageContent: '.pageContent'
    },
    views: {
      current: 'detail',
      detail: {
        Layout: DetailLayout
      },
      operator: {
        Layout: OperatorLayout
      }
    },
    onShow: function(){
      var that = this;
      // Fetch data for all projects
      // This is necessary for dynamic project property portfolios
      var fetchProjectData = function(){
        that.collection.projects.fetchIssues();
        that.collection.projects.fetchProjectKpis();
      };

      // Run initially to get latest data
      fetchProjectData();

      // Fetch issues every five minutes
      this.fetchIssuesInterval = setInterval(fetchProjectData, 300000);

      // Create the settings drop down
      this.buildSettingsDropdown();

      // Show left nav
      this.contentNavigation.show(this.portfolioNavigationListView);

      // Select context
      this.selectPortfolio(this.model, this.options.view);
    },
    onClose: function(){
      // Manually close the settings
      this.options.settingsRegion.close();
    },

    buildSettingsDropdown: function(){
      var that = this;

      var settingsDropdown = new Marionette.ItemView({
        tagName: 'li',
        template: {
          type: 'handlebars',
          template: portfoliosSettingsTemplate
        },
        className: 'menu dropdown',
        events: {
          'click .operatorview': function(event){
            that.selectPortfolio(that.model, 'operator');
          },
          'click .detailview': function(event){
            that.selectPortfolio(that.model, 'detail');
          },
          'click .edit': function(event){
            Backbone.history.navigate('/admin/portfolios/' + that.model.id, true);
          }
        }
      });

      //Create settings view
      this.options.settingsRegion.show(settingsDropdown);
    },

    selectPortfolio: function(portfolio, view) {
      // Set current view type or fall back to detail
      this.views.current = this.views[view] ? view : 'detail';

      // Update model
      this.model = portfolio;

      // Update breadcrumb
      Backbone.trigger('set:breadcrumbs', {model: portfolio, state: 'portfolio', display_name: portfolio.get('display_name')});

      // Instantiate sub view
      var detail = new this.views[this.views.current].Layout({model: portfolio});
      this.pageContent.show(detail);

      // Update active item
      this.portfolioNavigationListView.setActive(portfolio.id);
    },

    initialize: function(options){
      // Reset breadcrumbs
      Backbone.trigger('reset:breadcrumbs', {
        state: 'portfolio',
        display_name: this.model.get('display_name'),
        model: this.model
      });

      // Select specific view if one is passed
      this.views.current = options.view || this.views.current;

      // Build primary portfolio nav
      this.portfolioNavigationListView = new Portfolio.views.NavigationListView({
        collection: this.model.collection
      });

      // Listen for click event and update view
      this.listenTo(Backbone, 'click:portfolio', function(model){
        this.selectPortfolio(model);
      });
    }
  });
});
