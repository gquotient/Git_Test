define([
  "jquery",
  "backbone",
  "backbone.marionette",
  "backbone.marionette.handlebars",

  "app/ia",
  "app/modules/login",
  "app/modules/user/user",

  "hbs!app/layouts/index"
],
function($, Backbone, Marionette, MarionetteHandlebars, ia, Login, User, indexTemplate){

  ia.Controller = Backbone.Marionette.Controller.extend({
    index: function(){
      ia.setLayout(ia.mainLayout);
    },

    users: function(){
      ia.users = new User.Collection();

      ia.setLayout(ia.mainLayout);

      ia.setState("users");

      ia.users.fetch();

    }

  });

  var Router = Backbone.Marionette.AppRouter.extend({
    controller: new ia.Controller(),
    appRoutes: {
      "": "index",
      "users": "users"
    }
  });


  return Router;
});
