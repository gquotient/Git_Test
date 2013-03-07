define([
  "jquery",
  "backbone",
  "backbone.marionette",
  "backbone.marionette.handlebars",

  "app/ia",
  "app/modules/login",
  "app/modules/user/user",

  "app/modules/portfolio/portfolio",

  "hbs!app/layouts/index"
],
function($, Backbone, Marionette, MarionetteHandlebars, ia, Login, User, Portfolio, indexTemplate){

  ia.Controller = Backbone.Marionette.Controller.extend({
    portfolios: function(){
      var portfolios = new Portfolio.collections.NavigationList();

      ia.setLayout(ia.mainLayout);

      ia.setState("portfolios", {collection: portfolios, model: false, all: portfolios } );

      portfolios.fetch();
    },

    selectPortfolio: function(id){
      var portfolios = new Portfolio.collections.NavigationList();
      ia.setLayout(ia.mainLayout);
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
      "": "portfolios",
      "portfolios": "portfolios",
      "portfolios/:id": "selectPortfolio"
    }
  });


  return Router;
});
