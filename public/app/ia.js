 define(

  [
    'jquery',
    'underscore',

    'backbone',
    'backbone.marionette',
    "backbone.marionette.handlebars",

    "app/modules/user/user",
    "app/modules/portfolio/portfolio",
    "app/modules/header/header",

    "hbs!app/layouts/index"
  ],

  function($, _, Backbone, Marionette, MarionetteHandlebars, User, Portfolio, Header, indexTemplate){

    /* Instantiate the app */
    var ia = new Backbone.Marionette.Application();

    /* Empty object to hold different layouts. */
    ia.layouts = {};

    /* Create a new layout for the primary app view */
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


    /* Some app initialization. Breaking it up for clarity. */

    /* Bootstrap User */
    ia.addInitializer(function(){
      /* Create a new user instance that is the current session user */
      var currentUser = User.Model.extend(JSON.parse($('#currentUserData').html()));
      ia.currentUser = new currentUser();
    });


    /* Setup Layouts and Views */
    ia.addInitializer(function(){
      /* Define the primary region (this is the body) */
      ia.addRegions({
        main: "#ia"
      });

      ia.layouts.app = new AppLayout();
      ia.headerView = new Header.views.LoggedIn({model: ia.currentUser});
      ia.headerView.on("logout", function(){
        window.location = "/logout";
      });

      ia.main.show(ia.layouts.app);
      ia.layouts.app.header.show(ia.headerView);
    });

    return ia;
  }
);
