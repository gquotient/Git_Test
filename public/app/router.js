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
      "login": "login",
      "gate": "gate"
    },

    index: function(){
      console.log("Index.");
    },

    login: function(){
      var view = new Login.views.LoginView();

      $("body").append(view.$el);
      view.render();

    },

    gate: function(){
      console.log("bully");
    },

    initialize: function(){

    }
  });

  return Router;
});