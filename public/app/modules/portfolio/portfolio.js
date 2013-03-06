define(
  [
    "jquery",
    "backbone",
    "backbone.marionette",

    "hbs!app/modules/portfolio/templates/navigationItemView",
    "hbs!app/modules/portfolio/templates/allPortfoliosList",
    "hbs!app/modules/portfolio/templates/portfolioList"
  ],
  function($, Backbone, Marionette, navigationItemView, allPortfoliosList, portfolioList){
    var Portfolio = { models: {}, views: {}, collections: {} };

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
      // emptyView: allListView,
      initialize: function(){
        console.log(this.collection, this.model);
      },
      itemView: Portfolio.views.NavigationItemView
    });

    return Portfolio;
  }
);
