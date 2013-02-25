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
      ia.main.show(ia.mainLayout);
    },

    users: function(){
      ia.users = new User.Collection();

      console.log('users');

      var userView = new User.views.listView({
        collection: ia.users
      });

      ia.main.show(ia.mainLayout);
      ia.mainLayout.contentNavigation.show(userView);
      ia.users.fetch();

      userView.on("itemview:select:user", function(arg){
        var detailView = new User.views.detailView({model: arg.model});
        ia.mainLayout.mainContent.show(detailView);
      });
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