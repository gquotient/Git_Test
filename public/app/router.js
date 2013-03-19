define([
  "jquery",
  "backbone",
  "backbone.marionette",
  "backbone.marionette.handlebars",

  "app/ia",
  "app/modules/user/user",

  "app/modules/portfolio/portfolio"
],
function($, Backbone, Marionette, MarionetteHandlebars, ia, User, Portfolio){

  ia.Controller = Backbone.Marionette.Controller.extend({

    states: {
      portfolioFocus: function(options){
        var portfolioNavigationListView = new Portfolio.views.NavigationListView({
          collection: options.collection,
          model: options.model,
          basePortfolios: options.all
        });

        var detailLayout = new Portfolio.layouts.detailOverview();

        ia.layouts.app.contentNavigation.show(portfolioNavigationListView);
        ia.layouts.app.mainContent.show(detailLayout);
      }
    },

    setState: function(state, options){
      this.states[state](options);
    },

    index: function(){
      var portfolios = new Portfolio.collections.NavigationList();
      this.setState("portfolioFocus", {collection: portfolios, model: false, all: portfolios } );

      portfolios.fetch();
    },

    selectPortfolio: function(id){
      var portfolios = new Portfolio.collections.NavigationList();
      portfolios.fetch({
        success: function(collection, response, options){
          var subPortfolios = collection.subPortfolios(collection.get(id));
          var newList = new Portfolio.collections.NavigationList(subPortfolios);

          this.setState("portfolioFocus", {collection: newList, model: collection.get(id), all: portfolios} );
        }
      });
    },

    initialize: function(){
      //
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
