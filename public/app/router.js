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
    index: function(){
      ia.setLayout(ia.mainLayout);
    },

    users: function(){
      ia.users = new User.Collection();

      ia.setLayout(ia.mainLayout);

      ia.setState("users");

      ia.users.fetch();

    },

    portfolios: function(){
      var portfolios = new Portfolio.collections.NavigationList();

      ia.setLayout(ia.mainLayout);

      ia.setState("portfolios", portfolios);

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
          ia.setState("portfolios", newList);
        }
      })
    }

  });

  var Router = Backbone.Marionette.AppRouter.extend({
    controller: new ia.Controller(),
    appRoutes: {
      "": "index",
      "users": "users",
      "portfolios": "portfolios",
      "portfolios/:id": "selectPortfolio"
    }
  });


  return Router;
});
