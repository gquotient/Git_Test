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

      initialize: function(){
        this.listenTo(this, 'itemview:select:portfolio', this.selectPortfolio);
      },

      selectPortfolio: function(arg){
        var subPortfoliosIds = arg.model.get('subPortfolios');
        var subPortfolios = arg.model.collection.filter(function(model){
          return _.contains(subPortfoliosIds, model.id);
        });

        var newList = new Portfolio.collections.NavigationList(subPortfolios);
        this.model = arg.model;
        this.collection = newList;
        this.render();

        Backbone.history.navigate("portfolios/"+arg.model.id);
        // ia.setState("portfolios", {collection: newList, model: arg.model});
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
