define([
  // Application.
  "app",

  "modules/navigation"
],

function(app, Nav) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    routes: {
      "": "index"
    },

    index: function() {
      app.useLayout("main").setViews({
        'nav': new Nav.Views.List({ collection: this.navs }),
        '#links': new Nav.Views.Drill({ collection: this.navs })
      });
    },

    initialize: function(){
      this.navs = new Nav.Collection(Nav.STATIC);
    }
  });


  return Router;

});
