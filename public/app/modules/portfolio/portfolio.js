define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'project',

  'hbs!portfolio/templates/navigationItemView',
  'hbs!portfolio/templates/portfolioList',
  'hbs!portfolio/templates/detailKpis'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Project,

  navigationItemViewTemplate,
  portfolioListTemplate,
  detailKpisTemplate
){
  var Portfolio = { views: {} };

  Portfolio.Model = Backbone.Model.extend({
    defaults: {
      type: 'portfolio',

      dc_capacity: 0,
      ac_capacity: 0,
      irradiance_now: 0,
      power_now: 0
    },

    initialize: function(options){
      var root = this.collection.root;

      this.portfolios = new Portfolio.Collection([], {root: root});
      this.projects = new Project.Collection();

      this.listenTo(root.portfolios, 'add', function(model){
        if (_.contains(this.get('subPortfolioIDs'), model.id)) {
          this.addPortfolio(model);
        }
      });

      this.listenTo(root.projects, 'add', function(model){
        if (_.contains(this.get('projectIDs'), model.id)) {
          this.addProject(model);
        }
      });
    },

    addPortfolio: function(portfolio){
      this.portfolios.add(portfolio, {merge: true});

      this.portfolios.add(portfolio.portfolios.models, {merge: true});
      this.projects.add(portfolio.projects.models, {merge: true});

      this.listenTo(portfolio.portfolios, 'add', this.addPortfolio);
      this.listenTo(portfolio.projects, 'add', this.addProject);
    },

    addProject: function(project){
      this.projects.add(project, {merge: true});

      _.each(project.get('kpis'), function(value, key){
        var aggr = this.get(key) || 0;
        this.set(key, aggr + value);
      }, this);
    }
  });

  Portfolio.Root = Portfolio.Model.extend({
    initialize: function(options){
      this.portfolios = new Portfolio.Collection([], {
        url: '/api/portfolios',
        root: this
      });

      this.projects = new Project.Collection([], {
        url: '/api/projects'
      });

      this.listenTo(this.portfolios, 'change:kpis', this.calcKpis);
      this.listenTo(this.projects, 'change:kpis', this.calcKpis);
    }
  });

  Portfolio.Collection = Backbone.Collection.extend({
    model: Portfolio.Model,

    initialize: function(models, options){
      this.root = options.root;
    }
  });

  /* The item view is the view for the individual portfolios in the navigation. */
  Portfolio.views.NavigationItemView = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: navigationItemViewTemplate
    },
    attributes: {
      class: 'portfolio'
    },
    events: {
      'mouseover': function(){
        Backbone.trigger('mouseover:portfolio', this.model);
      },
      'mouseout': function(){
        Backbone.trigger('mouseout:portfolio', this.model);
      },
      'click': function(){
        Backbone.trigger('select:portfolio', this.model);
      }
    }
  });

  /* This composite view is the wrapper view for the list of portfolios.
     It handles nesting the list while allowing for the navigation header. */
  Portfolio.views.NavigationListView = Marionette.CompositeView.extend({
    tagName: 'ul',
    attributes: {
      class: 'portfolios'
    },
    template: {
      type: 'handlebars',
      template: portfolioListTemplate
    },

    // Tell the composite view which view to use as for each portfolio.
    itemView: Portfolio.views.NavigationItemView,

    initialize: function(options){
      this.listenTo(Backbone, 'select:portfolio', this.setPortfolio);
    },

    onRender: function(){
      // Handle if no sub portfolios exist
      if (this.collection.length === 0) {
        this.$el.append('<li class="empty">No sub portfolios</li>');
      }
    },

    // Setup the views for the current model.
    setPortfolio: function(model){
      this.model = model;
      // Set the current collection to be a new navigation list with the subPortfolios.
      this.collection = this.model.get('subPortfolios');

      // Trigger a render. This forces the nav header to update, too.
      this.render();
    }
  });

  Portfolio.views.detailKpis = Marionette.ItemView.extend({
    tagName: 'ul',
    template: {
      type: 'handlebars',
      template: detailKpisTemplate
    },
    initialize: function(options){
      var that = this;

      this.listenTo(Backbone, 'select:portfolio', function(model){
        that.model = model;

        that.render();
      });
    }
  });

  return Portfolio;
});
