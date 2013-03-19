 define(

  [
    'jquery',
    'underscore',

    'backbone',
    'backbone.marionette',
    "backbone.marionette.handlebars",

    "user",
    "header",

    "hbs!app/layouts/index"
  ],

  function($, _, Backbone, Marionette, MarionetteHandlebars, User, Header, indexTemplate){

    // Instantiate the app
    var ia = new Backbone.Marionette.Application();

    /* Empty object to hold different layouts. */
    ia.layouts = {};


    // Create a new layout for the primary app view
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

    // Bootstrap User
    ia.addInitializer(function(){
      // Create a new user instance that is the current session user
      ia.currentUser = new User.Model( JSON.parse($('#currentUserData').html()) );
    });


    // Setup Layouts and Views
    ia.addInitializer(function(){
      // Define the primary region (this is the body)
      ia.addRegions({
        main: "#ia"
      });

      ia.layouts.app = new AppLayout();
      ia.headerView = new Header.views.LoggedIn({model: ia.currentUser});
      ia.listenTo(ia.headerView, "logout", function(){
        window.location = "/logout";
      });

      ia.main.show(ia.layouts.app);
      ia.layouts.app.header.show(ia.headerView);
    });

    return ia;
  }
);
