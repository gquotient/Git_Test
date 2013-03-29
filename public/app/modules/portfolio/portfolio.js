define(
  [
    "jquery",
    "backbone",
    "backbone.marionette",
    "leaflet",
    "css!components/leaflet/dist/leaflet.css",

    "ia",

    "project",

    "hbs!portfolio/templates/navigationItemView",
    "hbs!portfolio/templates/portfolioList",
    //"hbs!portfolio/templates/detailOverview",
    "hbs!portfolio/templates/detailHeader",
    "hbs!portfolio/templates/detailKpis",
    "hbs!portfolio/templates/breadcrumbs",
  ],
  function($, Backbone, Marionette, L, leafletCSS, ia, Project, navigationItemView, portfolioList, detailHeaderTemplate, detailKpisTemplate, breadcrumbsTemplate){

    /* We could probably automate the stubbing out of this module structure. */
    var Portfolio = { models: {}, views: {}, layouts: {}, collections: {} };

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
        allProjects = allProjects.concat( this.get('projects') );
        _.each(this.get('subPortfolios'), function(portfolioId){
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
        this.aggregate();
        return this.attributes;
      }
    });

    /* Setup the url for the list of portfolios. This will be our list for navigation. */
    Portfolio.collections.NavigationList = Backbone.Collection.extend({
      model: Portfolio.models.Portfolio,
      url: '/api/portfolios',

      subPortfolios: function(model){
        return this.filterByIDs( model.get('subPortfolios') );
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
      /* When the portfolio tile is clicked, trigger a "select:portfolio" event. */
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

      /* Trigger events when we click "back" or "all". */
      triggers: {
        'click .back': 'set:back',
        'click .all': 'set:all'
      },

      /* This is a little hacky, but works for now:
       * AFAICT, the compositeView only passes the model to the template and not
       * an arbitrary object. So, we check the state of the breadcrumbs to determine
       * whether we can set the attributes to false (i.e. there is no model) to
       * trigger the state for "All Portfolios".
       */
      serializeData: function() {
        var name, prevModel;
        if (this.model) {
          name = this.model.get("name");
          if (this.breadcrumbs.length > 1){
            prevModel = this.breadcrumbs[this.breadcrumbs.length - 1].get("name");
          }
        } else {
          name = false;
          prevModel = false;
        }
        return { "name": name, "prevModel": prevModel };
      },

      /* Setup an array for tracking breadcrumbs. Attach event listeners. */
      initialize: function(options){
        this.controller = options.controller;

        this.breadcrumbs = [];
        /* When one of the itemView (individual portfolios) is clicked, it
         * triggers the "itemView:select:portfolio" event. */
        this.listenTo(this, 'itemview:select:portfolio', this.nextPortfolio);
        this.listenTo(this, 'set:back', this.back);
        // this.listenTo(this, 'set:all', this.setAll);

        this.listenTo(this.controller, 'set:portfolio', function(model){
          console.log('Nav list view heard controller set:portfolio', model);
        });
      },

      /* Adds this _current_ model to the breadcrumb before setting the new model to be
       * the current model.
       */
      nextPortfolio: function(arg){
        if(this.model) {
          this.breadcrumbs.push(this.model);
        } else {
          this.breadcrumbs.push(false);
        }
        this.model = arg.model;
        this.setPortfolio();
      },

      /* Get the previous model and collection off the stack and set to be current. */
      back: function(){
        this.model = this.breadcrumbs.pop();
        this.setPortfolio();
      },

      /* Setup the views for the current model. */
      setPortfolio: function(){
        this.controller.trigger('set:portfolio', this.model);

        //this.controller.triggerMethod('wtf', 'Ima model');
        /* There's a chance that this.model is false in the case where we are returning
         * to "all portfolios" */
        if(this.model){
          /* Currently we are storing the subPortfolio IDs on the model. */
          var subPortfoliosIds = this.model.get('subPortfolios');

          /* Use the IDs of the subportfolios to filter the full list of portfolios. */
          // var subPortfolios = this.options.basePortfolios.filter(function(model){
          //   return _.contains(subPortfoliosIds, model.id);
          // });

          var subPortfolios = this.options.basePortfolios.filterByIDs(subPortfoliosIds);

          /* Set the current collection to be a new navigation list with the subPortfolios. */
          this.collection = new Portfolio.collections.NavigationList(subPortfolios);

          /* Trigger a render. This forces the nav header to update, too. */
          this.render();

          /* Update the address bar to reflect the new model. */
          Backbone.history.navigate("portfolios/"+ this.model.id);
        } else {
          this.breadcrumbs = [];
          this.collection = this.options.basePortfolios;
          this.render();

          Backbone.history.navigate("/");
        }

        this.trigger('set:portfolio', this.model);
      }
    });



    /*
    Portfolio.views.detailHeader = Backbone.Marionette.ItemView.extend({
      template: {
        type: "handlebars",
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

    Portfolio.views.breadcrumbs = Backbone.Marionette.ItemView.extend({
      template: {
        type: "handlebars",
        template: breadcrumbsTemplate
      },
      initialize: function(options){
        var that = this;

        this.controller = options.controller;

        this.listenTo(this.controller, 'set:portfolio', function(model){
          console.log('breadcrumbs heard controller set:portfolio', model);
        });
      }
    });

    Portfolio.views.detailKpis = Backbone.Marionette.ItemView.extend({
      template: {
        type: "handlebars",
        template: detailKpisTemplate
      }
    });

    return Portfolio;
  }
);
