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
    onShow: function(){
      // Create the settings drop down
      this.buildSettingsDropdown();

      // Show left nav
      this.contentNavigation.show(this.portfolioNavigationListView);

      // Select context
      this.selectPortfolio(this.options.model);
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
          'click .viewDashboard': function(event){
            Backbone.history.navigate('/portfolio/operatorview/' + that.model.id, true);
          },
          'click .edit': function(event){
            Backbone.history.navigate('/admin/portfolios/' + that.model.id, true);
          }
        }
      });

      //Create settings view
      this.options.settingsRegion.show(settingsDropdown);
    },

    selectPortfolio: function(portfolio) {
      // Update breadcrumb
      Backbone.trigger('set:breadcrumbs', {model: portfolio, state: 'portfolio', display_name: portfolio.get('display_name')});

      // Instantiate detail layout
      var detail = new DetailLayout({model: portfolio});
      this.pageContent.show(detail);

      // Update active item
      this.portfolioNavigationListView.setActive(portfolio.id);
    },

    initialize: function(options){
      // Build primary portfolio nav
      this.portfolioNavigationListView = new Portfolio.views.NavigationListView({
        collection: options.portfolios
      });

      // Listen for click event and update view
      this.listenTo(Backbone, 'click:portfolio', function(model){
        this.selectPortfolio(model);

        Backbone.history.navigate('/portfolio/' + model.id);
      });
    }
  });
});
