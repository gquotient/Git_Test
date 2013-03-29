define(
  [
    'jquery',
    'backbone',
    'backbone.marionette',

    '../../../app/ia',

    'project',

    'hbs!portfolio/templates/navigationItemView',
    'hbs!portfolio/templates/portfolioList',
    'hbs!portfolio/templates/detailOverview',
    'hbs!portfolio/templates/detailHeader',
    'hbs!portfolio/templates/detailKpis'
  ],
  function($, Backbone, Marionette, ia, Project, navigationItemView, portfolioList, detailOverview, detailHeaderTemplate, detailKpisTemplate){

    /* We could probably automate the stubbing out of this module structure. */
    var Portfolio = { models: {}, views: {}, layouts: {}, collections: {} };

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
        this.aggregate();
        return this.attributes;
      },

      updateSubportfolios: function(){
        this.set('subPortfolios', new Portfolio.collections.NavigationList( this.collection.filterByIDs( this.get('subPortfolioIDs')) ));
      },

      initialize: function(){
        if(this.collection){
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

      /* This is a little hacky, but works for now:
       * AFAICT, the compositeView only passes the model to the template and not
       * an arbitrary object. So, we check the state of the breadcrumbs to determine
       * whether we can set the attributes to false (i.e. there is no model) to
       * trigger the state for 'All Portfolios'.
       */
      serializeData: function() {
        var name, prevModel;
        if (this.model) {
          name = this.model.get('name');
          if (this.breadcrumbs.length > 1){
            prevModel = this.breadcrumbs[this.breadcrumbs.length - 1].get('name');
          }
        } else {
          name = false;
          prevModel = false;
        }
        return { 'name': name, 'prevModel': prevModel };
      },

      /* Setup an array for tracking breadcrumbs. Attach event listeners. */
      initialize: function(){
        this.breadcrumbs = [];
        /* When one of the itemView (individual portfolios) is clicked, it
         * triggers the 'itemView:select:portfolio' event. */
        this.listenTo(this, 'itemview:select:portfolio', this.nextPortfolio);
        this.listenTo(this, 'set:back', this.back);
        // this.listenTo(this, 'set:all', this.setAll);
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

        /* There's a chance that this.model is false in the case where we are returning
         * to 'all portfolios' */
        if(this.model){
          /* Currently we are storing the subPortfolio IDs on the model. */
          // var subPortfoliosIds = this.model.get('subPortfolioIDs');

          /* Use the IDs of the subportfolios to filter the full list of portfolios. */
          // var subPortfolios = this.options.basePortfolios.filter(function(model){
          //   return _.contains(subPortfoliosIds, model.id);
          // });

          // var subPortfolios = this.options.basePortfolios.filterByIDs(subPortfoliosIds);

          /* Set the current collection to be a new navigation list with the subPortfolios. */
          this.collection = this.model.get('subPortfolios');

          /* Trigger a render. This forces the nav header to update, too. */
          this.render();

          if(this.model.id){
            /* Update the address bar to reflect the new model. */
            Backbone.history.navigate('portfolios/'+ this.model.id);
          } else {
            // this.breadcrumbs = [];
            // this.collection = this.options.basePortfolios;
            // this.render();
            Backbone.history.navigate('/');
          }
        }

        this.trigger('set:portfolio', this.model);
      }
    });

    Portfolio.layouts.detailOverview = Backbone.Marionette.Layout.extend({
      template: {
        type: 'handlebars',
        template: detailOverview
      },
      regions: {
        header: '#detail_header',
        kpis: '#kpis',
        map: '#map_view',
        alarms: '#alarms',
        projects: '#projects'
      },
      initialize: function(options){
        var self = this;
        this.listenTo(options.sourceView, 'set:portfolio', function(portfolio){
          var header = new Portfolio.views.detailHeader({model: portfolio});
          self.header.show(header);

          var kpisView = new Portfolio.views.detailKpis({ model: portfolio});
          self.kpis.show(kpisView);

          var projects;

          if (portfolio) {
            projects = new Project.collections.DataList(options.projectList.filterByIDs(portfolio.getAllProjects()));
          } else {
            projects = options.projectList;
          }

          var projectList = new Project.views.DataList({ collection: projects });
          self.projects.show(projectList);

        });
      }
    });

    Portfolio.views.detailHeader = Backbone.Marionette.ItemView.extend({
      template: {
        type: 'handlebars',
        template: detailHeaderTemplate
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
