define([
  "app"
],

function(app){
  var Router = Backbone.Router.extend({
    routes: {
      "": "index"
    },

    index: function(){
      console.log("index");
    }
  })

  return Router;
})