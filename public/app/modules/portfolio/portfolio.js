define(
  [
    "jquery",
    "backbone",
    "backbone.marionette",

    "hbs!app/modules/portfolio/templates/navigationItemView"
  ], 
  function($, Backbone, Marionette, navigationItemView){
    var Portfolio = { models: {}, views: {}, collections: {} }

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
      tagName: "li"
    });

    Portfolio.views.NavigationListView = Backbone.Marionette.CollectionView.extend({
      itemView: Portfolio.views.NavigationItemView,
      tagName: "ul"
    });

    return Portfolio;
  }
)