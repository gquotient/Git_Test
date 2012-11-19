define([
  "app",

  "modules/Test"
],

function(app, Test){
  var Router = Backbone.Router.extend({
    routes: {
      "": "index"
    },

    index: function(){
      var testList = new Test.Collection();

      testList.fetch();
    }
  })

  return Router;
})