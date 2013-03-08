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

      serializeData: function() {
        var name, prevModel;
        if (this.model) {
          name = this.model.get("name");
          if (this.breadcrumbs.length > 1){
            prevModel = this.breadcrumbs[this.breadcrumbs.length - 1].model.get("name");
          }
        } else {
          name = false;
          prevModel = false;
        }
        return { "name": name, "prevModel": prevModel };
      },

      initialize: function(){
        this.breadcrumbs = [];
        this.listenTo(this, 'itemview:select:portfolio', this.nextPortfolio);
        this.listenTo(this, 'set:back', this.back);
        this.listenTo(this, 'set:all', this.setAll);
      },

      setAll: function(){
        this.breadcrumbs = [];
        this.collection = this.options.basePortfolios;
        this.model = false;
        this.render();

        Backbone.history.navigate("/");
      },

      back: function(){
        var backSet = this.breadcrumbs.pop();
        this.collection = backSet.collection;
        this.model = backSet.model;

        this.setPortfolio();
      },

      nextPortfolio: function(arg){
        if(this.model) {
          this.breadcrumbs.push({model: this.model, collection: this.collection});
        } else {
          this.breadcrumbs.push({model: false, collection: this.basePortfolios});
        }
        this.model = arg.model;
        this.setPortfolio();
      },

      setPortfolio: function(){
        var subPortfoliosIds = this.model.get('subPortfolios');
        var subPortfolios = this.options.basePortfolios.filter(function(model){
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
