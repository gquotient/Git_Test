define(
  [
    'jquery',
    'backbone',
    'backbone.marionette',
    'leaflet',
    'css!components/leaflet/dist/leaflet.css',

    'hbs!portfolio/templates/navigationItemView',
    'hbs!portfolio/templates/portfolioList',
    'hbs!portfolio/templates/detailHeader',
    'hbs!portfolio/templates/detailKpis',
    'hbs!portfolio/templates/breadcrumbs',
    "hbs!portfolio/templates/breadcrumbItem"

  ],
  function($, Backbone, Marionette, L, leafletCSS, navigationItemView, portfolioList, detailHeaderTemplate, detailKpisTemplate, breadcrumbsTemplate, breadcrumbItemTemplate){

    /* We could probably automate the stubbing out of this module structure. */
    var Portfolio = { models: {}, views: {}, layouts: {}, collections: {} };

    // Controller handles event propgation, all views must have the controller
    Portfolio.controller = Backbone.Marionette.Controller.extend({
      initialize: function(){
        this.listenTo(this, 'set:portfolio', function(model){
          console.log('set:portfolio triggered on controller', model);
        });
      }
    });

    /* Setup a model. */
    Portfolio.models.Portfolio = Backbone.Model.extend({
      getAllProjects: function(){
        var self = this;
        var allProjects = [];
        allProjects = allProjects.concat( this.get('projectIDs') );
        _.each(this.get('subPortfolioIDs'), function(portfolioId){
          var portfolio = self.collection.get(portfolioId);
          allProjects = allProjects.concat(portfolio.getAllProjects() );
        });
        return allProjects;
      },

      aggregate: function(){
        this.set('allProjects', this.getAllProjects() );
        var projects = this.collection.projects.filterByIDs(this.get('allProjects'));
        this.set('dc_capacity', _.reduce(projects, function(memo, p){ return memo + p.get('kpis').dc_capacity; }, 0) );
        this.set('ac_capacity', _.reduce(projects, function(memo, p){ return memo + p.get('kpis').ac_capacity; }, 0) );
        this.set('irradiance_now', _.reduce(projects, function(memo, p){ return memo + p.get('kpis').irradiance_now; }, 0) );
        this.set('power_now', _.reduce(projects, function(memo, p){ return memo + p.get('kpis').power_now; }, 0) );
      },

      toJSON: function(){
        // this.aggregate();
        return this.attributes;
      },

      updateSubportfolios: function(){
        this.set('subPortfolios', new Portfolio.collections.NavigationList( this.collection.filterByIDs( this.get('subPortfolioIDs')) ));
      },

      initialize: function(){
        if(this.collection){
          // This might over-fire and could be a deferred instead?
          this.listenTo(this.collection, 'change', this.updateSubportfolios);
        }
      }
    });

    /* Create a canonical 'All Portfolios' */
    Portfolio.collections.All = Backbone.Collection.extend({
      model: Portfolio.models.Portfolio,
      url: '/api/portfolios',

      subPortfolios: function(model){
        return this.filterByIDs( model.get('subPortfolioIDs') );
      }
    });

    /* Setup the url for the list of portfolios. This will be our list for navigation. */
    Portfolio.collections.NavigationList = Backbone.Collection.extend({
      model: Portfolio.models.Portfolio,
      // url: '/api/portfolios',

      subPortfolios: function(model){
        return this.filterByIDs( model.get('subPortfolioIDs') );
      }
    });

    /* Create a collection just for Breadcrumbs. */
    Portfolio.collections.BreadcrumbList = Backbone.Collection.extend({
      model: Portfolio.models.Portfolio,

      initialize: function(models, options){
        var that = this;
        this.controller = options.controller;
        this.listenTo(this.controller, 'set:portfolio', function(model){
          that.add(model);
        });
      }

    });

    /* The item view is the view for the individual portfolios in the navigation. */
    Portfolio.views.NavigationItemView = Backbone.Marionette.ItemView.extend({
      template: {
        type: 'handlebars',
        template: navigationItemView
      },
      attributes: {
        class: 'portfolio'
      },
      /* When the portfolio tile is clicked, trigger a 'select:portfolio' event. */
      triggers: {
        'click': 'select:portfolio'
      }
    });

    /* This composite view is the wrapper view for the list of portfolios.
       It handles nesting the list while allowing for the navigation header. */
    Portfolio.views.NavigationListView = Backbone.Marionette.CompositeView.extend({
      template: {
        type: 'handlebars',
        template: portfolioList
      },

      /* Tell the composite view which view to use as for each portfolio. */
      itemView: Portfolio.views.NavigationItemView,

      /* Trigger events when we click 'back' or 'all'. */
      triggers: {
        'click .back': 'set:back',
        'click .all': 'set:all'
      },

      /* Setup an array for tracking breadcrumbs. Attach event listeners. */
      initialize: function(options){
        this.controller = options.controller;

        this.listenTo(this, 'itemview:select:portfolio', this.nextPortfolio);

        this.listenTo(this.controller, 'select:portfolio', function(model){
          console.log('Nav list view heard controller select:portfolio', model);
          this.nextPortfolio(model);
        });
      },

      /* Adds this _current_ model to the breadcrumb before setting the new model to be
       * the current model.
       */
      nextPortfolio: function(arg){
        this.model = arg.model;
        this.setPortfolio();
      },

      /* Setup the views for the current model. */
      setPortfolio: function(){
        this.controller.trigger('set:portfolio', this.model);

        /* Set the current collection to be a new navigation list with the subPortfolios. */
        this.collection = this.model.get('subPortfolios');

        /* Trigger a render. This forces the nav header to update, too. */
        this.render();

        if(this.model.id){
          /* Update the address bar to reflect the new model. */
          Backbone.history.navigate('portfolios/'+ this.model.id);
        } else {
          Backbone.history.navigate('/');
        }

        this.trigger('set:portfolio', this.model);
      }
    });

    Portfolio.views.BreadcrumbItemView = Backbone.Marionette.ItemView.extend({
      tagName: 'li',
      template: {
        type: 'handlebars',
        template: breadcrumbItemTemplate
      },
      triggers: {
        'click': 'select:portfolio'
      }
    });

    Portfolio.views.Breadcrumbs = Backbone.Marionette.CollectionView.extend({
      tagName: 'ul',
      itemView: Portfolio.views.BreadcrumbItemView,
      attributes: {
        class: 'breadcrumbs'
      },
      initialize: function(options){
        this.controller = options.controller;
        this.controller.listenTo(this, 'itemview:select:portfolio', function(arg){
          options.controller.trigger('select:portfolio', arg);
        });
      }
    });



    /*
    Portfolio.views.detailHeader = Backbone.Marionette.ItemView.extend({
      template: {
        type: 'handlebars',
        template: detailHeaderTemplate
      }
    });
    */

    Portfolio.views.map = Backbone.Marionette.ItemView.extend({
      render: function(){
        // Create a container for the leaflet map
        this.setElement($('<div id="leafletContainer" />'));
      },
      build: function(){
        var map = L.map('leafletContainer').setView([30.2, -97.7], 1);

        // add an OpenStreetMap tile layer
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
      }
    });

    Portfolio.views.detailKpis = Backbone.Marionette.ItemView.extend({
      template: {
        type: 'handlebars',
        template: detailKpisTemplate
      }
    });

    return Portfolio;
  }
);
