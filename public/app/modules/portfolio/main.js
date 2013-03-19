define(
  [
    "jquery",
    "backbone",
    "backbone.marionette",

    "hbs!portfolio/templates/navigationItemView",
    "hbs!portfolio/templates/allPortfoliosList",
    "hbs!portfolio/templates/portfolioList",
    "hbs!portfolio/templates/detailOverview"
  ],
  function($, Backbone, Marionette, navigationItemView, allPortfoliosList, portfolioList, detailOverview){

    /* We could probably automate the stubbing out of this module structure. */
    var Portfolio = { models: {}, views: {}, layouts: {}, collections: {} };

    /* Setup a model. */
    Portfolio.models.Portfolio = Backbone.Model.extend({});

    /* Setup the url for the list of portfolios. This will be our list for navigation. */
    Portfolio.collections.NavigationList = Backbone.Collection.extend({
      model: Portfolio.models.Portfolio,
      url: '/api/portfolios',

      subPortfolios: function(model){
        var subPortfoliosIds = model.get('subPortfolios');
        var subPortfolios = this.filter(function(portfolio){
          return _.contains(subPortfoliosIds, portfolio.id);
        });
        return subPortfolios;
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
      initialize: function(){
        this.breadcrumbs = [];
        /* When one of the itemView (individual portfolios) is clicked, it
         * triggers the "itemView:select:portfolio" event. */
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
        if(this.model){
          this.setPortfolio();
        } else {
          this.breadcrumbs = [];
          this.collection = this.options.basePortfolios;
          this.model = false;
          this.render();

          Backbone.history.navigate("/");
        }
      },

      /* Setup the views for the current model. */
      setPortfolio: function(){
        /* Currently we are storing the subPortfolio IDs on the model. */
        var subPortfoliosIds = this.model.get('subPortfolios');

        /* Use the IDs of the subportfolios to filter the full list of portfolios. */
        var subPortfolios = this.options.basePortfolios.filter(function(model){
          return _.contains(subPortfoliosIds, model.id);
        });

        /* Set the current collection to be a new navigation list with the subPortfolios. */
        this.collection = new Portfolio.collections.NavigationList(subPortfolios);

        /* Trigger a render. This forces the nav header to update, too. */
        this.render();

        /* Update the address bar to reflect the new model. */
        Backbone.history.navigate("portfolios/"+ this.model.id);
      }
    });

    Portfolio.layouts.detailOverview = Backbone.Marionette.Layout.extend({
      template: {
        type: 'handlebars',
        template: detailOverview
      },
      regions: {
        detailName: "#detail_name",
        mapView: "#map_view",
        alarms: "#alarms",
        projects: "#projects"
      }
    });

    return Portfolio;
  }
);
