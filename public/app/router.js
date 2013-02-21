define([
  "jquery",
  "backbone",
  "app/ia",
  "app/modules/login"
],
function($, Backbone, ia, Login){
  var Router = Backbone.Router.extend({
    routes: {
      "": "index",
      "login": "login"
    },

    index: function(){
      console.log("Index.");
    },

    login: function(){
      var view = new Login.views.LoginView();

      $("body").append(view.$el);
      view.render();

    },

    initialize: function(){

    }
  });

  return Router;
});