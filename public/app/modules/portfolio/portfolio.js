define(
  [
    'jquery',
    'underscore',
    'backbone',
    'backbone.marionette',
    'leaflet',
    'css!components/leaflet/dist/leaflet.css',

    'project',

    'hbs!portfolio/templates/navigationItemView',
    'hbs!portfolio/templates/portfolioList',
    'hbs!portfolio/templates/detailKpis',
    'hbs!portfolio/templates/breadcrumbItem'
  ],
  function($, _, Backbone, Marionette, L, leafletCSS, Project, navigationItemView, portfolioList, detailKpisTemplate, breadcrumbItemTemplate){

    /* We could probably automate the stubbing out of this module structure. */
    var Portfolio = { models: {}, views: {}, layouts: {}, collections: {} };

    /* Setup a model. */
    Portfolio.models.Portfolio = Backbone.Model.extend({
      build: function(){
        var subPortfolioIDs = this.get('subPortfolioIDs'),
            allProjectIDs = [];

        allProjectIDs = allProjectIDs.concat(this.get('projectIDs'));

        this.set('subPortfolios', new Portfolio.collections.NavigationList( this.collection.filterByIDs( subPortfolioIDs ) ));
        this.get('subPortfolios').each( function(portfolio){
          if(!portfolio.get('built')) {
            portfolio.build();
          }
          allProjectIDs = allProjectIDs.concat(portfolio.get('allProjectIDs'));
        });

        this.set('allProjectIDs', _.uniq(allProjectIDs) );

        var projects =  new Project.collections.Projects(this.collection.projects.filterByIDs(this.get('allProjectIDs')) );
        this.set('projects', projects);
        this.set('dc_capacity', projects.reduce( function(memo, p){ return memo + p.get('kpis').dc_capacity; }, 0 ) );
        this.set('ac_capacity', projects.reduce( function(memo, p){ return memo + p.get('kpis').ac_capacity; }, 0) );
        this.set('irradiance_now', projects.reduce( function(memo, p){ return memo + p.get('kpis').irradiance_now; }, 0) );
        this.set('power_now', projects.reduce( function(memo, p){ return memo + p.get('kpis').power_now; }, 0) );

        this.set('built', true);
      },

      initialize: function(){
        this.set('built', false);
        this.listenTo(this.collection, 'reset', this.build);
        this.listenTo(this.collection.projects, 'reset', this.build);
      }
    });

    /* Setup Master Portfolio */
    Portfolio.models.AllPortfolio = Backbone.Model.extend({
      build: function(){
        var projects = this.get('projects');
        this.set('projects', this.get('projects').clone());
        this.set('dc_capacity', projects.reduce( function(memo, p){ return memo + p.get('kpis').dc_capacity; }, 0 ) );
        this.set('ac_capacity', projects.reduce( function(memo, p){ return memo + p.get('kpis').ac_capacity; }, 0) );
        this.set('irradiance_now', projects.reduce( function(memo, p){ return memo + p.get('kpis').irradiance_now; }, 0) );
        this.set('power_now', projects.reduce( function(memo, p){ return memo + p.get('kpis').power_now; }, 0) );
      },

      initialize: function(options){
        this.listenTo(options.projects, "reset", this.build);
      }
    });

    /* Create a canonical 'All Portfolios' */
    Portfolio.collections.All = Backbone.Collection.extend({
      model: Portfolio.models.Portfolio,
      url: '/api/portfolios',

      subPortfolios: function(model){
        return this.filterByIDs( model.get('subPortfolioIDs') );
      },

      initialize: function(models, options){
        this.projects = options.projects;
      }
    });

    /* Setup the url for the list of portfolios. This will be our list for navigation. */
    Portfolio.collections.NavigationList = Backbone.Collection.extend({
      model: Portfolio.models.Portfolio
    });

    /* Create a collection just for Breadcrumbs. */
    Portfolio.collections.BreadcrumbList = Backbone.Collection.extend({
      model: Portfolio.models.Portfolio,

      initialize: function(models, options){
        var that = this;

        this.listenTo(Backbone, 'select:portfolio', function(arg){
          if ( that.contains(arg.model) ) {
            that.reset( that.slice(0,that.indexOf(arg.model)+1) );
          } else {
            that.add(arg.model);
          }
        });
      }

    });

    /* The item view is the view for the individual portfolios in the navigation. */
    Portfolio.views.NavigationItemView = Marionette.ItemView.extend({
      tagName: 'li',
      template: {
        type: 'handlebars',
        template: navigationItemView
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
          Backbone.trigger('select:portfolio', { model: this.model });
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
        template: portfolioList
      },

      /* Tell the composite view which view to use as for each portfolio. */
      itemView: Portfolio.views.NavigationItemView,

      /* Setup an array for tracking breadcrumbs. Attach event listeners. */
      initialize: function(options){
        this.listenTo(Backbone, 'select:portfolio', this.setPortfolio);
      },

      /* Setup the views for the current model. */
      setPortfolio: function(arg){
        this.model = arg.model;
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
      }
    });

    Portfolio.views.BreadcrumbItemView = Marionette.ItemView.extend({
      tagName: 'li',
      template: {
        type: 'handlebars',
        template: breadcrumbItemTemplate
      },
      triggers: {
        'click': 'select:portfolio'
      }
    });

    Portfolio.views.Breadcrumbs = Marionette.CollectionView.extend({
      tagName: 'ul',
      itemView: Portfolio.views.BreadcrumbItemView,
      attributes: {
        class: 'breadcrumbs'
      },
      initialize: function(options){
        Backbone.listenTo(this, 'itemview:select:portfolio', function(arg){
          Backbone.trigger('select:portfolio', arg);
        });
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

        this.listenTo(Backbone, 'select:portfolio', function(options){
          that.model = options.model;

          that.render();
        });
      }
    });

    return Portfolio;
  }
);
