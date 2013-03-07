define(
  [
    "jquery",
    "backbone",
    "backbone.marionette",

    "hbs!app/modules/portfolio/templates/navigationItemView",
    "hbs!app/modules/portfolio/templates/allPortfoliosList",
    "hbs!app/modules/portfolio/templates/portfolioList",
    "hbs!app/modules/portfolio/templates/detailOverview"
  ],
  function($, Backbone, Marionette, navigationItemView, allPortfoliosList, portfolioList, detailOverview){
    var Portfolio = { models: {}, views: {}, layouts: {}, collections: {} };

    Portfolio.models.Portfolio = Backbone.Model.extend({

    });

    Portfolio.collections.NavigationList = Backbone.Collection.extend({
      model: Portfolio.models.Portfolio,
      url: '/api/portfolios'
    });

    Portfolio.views.NavigationItemView = Backbone.Marionette.ItemView.extend({
      template: {
        type: 'handlebars',
        template: navigationItemView
      },
      attributes: {
        class: 'portfolio'
      },
      triggers: {
        'click': 'select:portfolio'
      }
    });

    var allListView = Backbone.Marionette.ItemView.extend({
      template: {
        type: 'handlebars',
        template: allPortfoliosList
      }
    });

    Portfolio.views.NavigationListView = Backbone.Marionette.CompositeView.extend({
      template: {
        type: 'handlebars',
        template: portfolioList
      },

      itemView: Portfolio.views.NavigationItemView,

      triggers: {
        'click .back': 'set:back',
        'click .all': 'set:all'
      },

      initialize: function(){
        this.listenTo(this, 'itemview:select:portfolio', this.nextPortfolio);
        this.listenTo(this, 'set:back', this.back);
        this.listenTo(this, 'set:all', this.setAll);
      },

      setAll: function(){
        this.collection = this.options.all;
        this.model = false;
        this.render();

        Backbone.history.navigate("/");
      },

      back: function(){
        this.collection = this.model.get('prevCollection');
        this.model = this.model.get('prevModel');
        this.setPortfolio(this.model);
      },

      nextPortfolio: function(arg){
        if(this.model) {
          arg.model.set('prevModel', this.model);
          arg.model.set('prevCollection', this.collection);
        }
        this.model = arg.model;
        this.setPortfolio();
      },

      setPortfolio: function(model){
        var subPortfoliosIds = this.model.get('subPortfolios');
        var subPortfolios = this.options.all.filter(function(model){
          return _.contains(subPortfoliosIds, model.id);
        });

        var newList = new Portfolio.collections.NavigationList(subPortfolios);
        this.collection = newList;

        this.render();

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
