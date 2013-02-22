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
    initialize: function(){
      ia.addRegions({
        main: "body"
      });

      ia.users = new User.Collection();
      ia.users.fetch();

      var AppLayout = Backbone.Marionette.Layout.extend({
        template: {
          type: 'handlebars',
          template: indexTemplate
        },
        regions: {
          header: "#header",
          navigation: "#navigation",
          contentNavigation: "#contentNavigation",
          mainContent: "#content",
          footer: "#footer"
        }
      });

      ia.mainLayout = new AppLayout();
    },

    index: function(){
      ia.main.show(ia.mainLayout);
    },

    users: function(){
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
    },
    routes: {
      "login": "login"
    },

    login: function(){
      var view = new Login.views.LoginView();

      $("body").append(view.$el);
      view.render();

    },

    initialize: function(){

    }
  });

  ia.addInitializer(function(options){
    new Router();
    Backbone.history.start();
  });

  return Router;
});