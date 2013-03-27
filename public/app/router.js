define([
  "jquery",
  "backbone",
  "backbone.marionette",
  "backbone.marionette.handlebars",

  "app/ia",

  "user",
  "portfolio"
],
function($, Backbone, Marionette, MarionetteHandlebars, ia, User, Portfolio){

  ia.Controller = Backbone.Marionette.Controller.extend({

    states: {
      // Primary State for navigating and viewing portfolios.
      portfolio: function(options){

        // Create the navigation view.
        var portfolioNavigationListView = new Portfolio.views.NavigationListView({
          collection: options.collection,
          model: options.model,
          basePortfolios: ia.portfolios
        });

        // Create the layout for
        var detailLayout = new Portfolio.layouts.detailOverview({sourceView: portfolioNavigationListView, projectList: ia.projects});

        ia.layouts.app.contentNavigation.show(portfolioNavigationListView);
        ia.layouts.app.mainContent.show(detailLayout);

        portfolioNavigationListView.setPortfolio();

      },
      project: function(options){

      }
    },

    index: function(){
      this.trigger("state:portfolio", {collection: ia.portfolios, model: false } );
    },

    selectPortfolio: function(id){
      var self = this;

      var subPortfolios = ia.portfolios.subPortfolios(ia.portfolios.get(id));
      var newList = new Portfolio.collections.NavigationList(subPortfolios);

      self.trigger("state:portfolio", {collection: newList, model: ia.portfolios.get(id)} );
    },

    initialize: function(){
      var self = this;
      this.listenTo(this, "state:portfolio", function(options){ self.states.portfolio(options); });
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
