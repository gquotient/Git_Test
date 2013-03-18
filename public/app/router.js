define([
  "jquery",
  "backbone",
  "backbone.marionette",
  "backbone.marionette.handlebars",

  "app/ia",
  "app/modules/user/user",

  "app/modules/portfolio/portfolio",

  "hbs!app/layouts/index"
],
function($, Backbone, Marionette, MarionetteHandlebars, ia, User, Portfolio, indexTemplate){

  ia.Controller = Backbone.Marionette.Controller.extend({
    index: function(){
      var portfolios = new Portfolio.collections.NavigationList();
      ia.setState("portfolios", {collection: portfolios, model: false, all: portfolios } );

      portfolios.fetch();
    },

    selectPortfolio: function(id){
      var portfolios = new Portfolio.collections.NavigationList();
      portfolios.fetch({
        success: function(collection, response, options){
          var selectedPortfolio = collection.get(id);

          var subPortfoliosIds = selectedPortfolio.get('subPortfolios');
          var subPortfolios = collection.filter(function(model){
            return _.contains(subPortfoliosIds, model.id);
          });
          var newList = new Portfolio.collections.NavigationList(subPortfolios);
          ia.setState("portfolios", {collection: newList, model: selectedPortfolio, all: portfolios} );
        }
      });
    }

  });

  var Router = Backbone.Marionette.AppRouter.extend({
    controller: new ia.Controller(),
    appRoutes: {
      "": "index",
      "portfolios": "index",
      "portfolios/:id": "selectPortfolio"
    }
  });


  return Router;
});
