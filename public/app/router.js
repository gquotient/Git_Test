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
      ia.portfolios = new Portfolio.collections.NavigationList();

      ia.setLayout(ia.mainLayout);

      ia.setState("portfolios");

      ia.portfolios.fetch();
    }

  });

  var Router = Backbone.Marionette.AppRouter.extend({
    controller: new ia.Controller(),
    appRoutes: {
      "": "index",
      "users": "users",
      "portfolios": "portfolios"
    }
  });


  return Router;
});
