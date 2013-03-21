 define(

  [
    'jquery',
    'underscore',

    'backbone',
    'backbone.marionette',
    "backbone.marionette.handlebars",

    "user",
    "header",
    "portfolio",
    "project",

    "hbs!app/layouts/index"
  ],

  function($, _, Backbone, Marionette, MarionetteHandlebars, User, Header, Portfolio, Project, indexTemplate){

    /* I'm not sure where else to put this right now, so I'm going to put it here.
     * I'm going to extend Backbone's "Collection" with a method to return a subset of
     * models by ID. It's a shortcut to collection.filter(...).
     */

    Backbone.Collection.prototype.filterByIDs = function(ids){
      return this.filter( function(model){ 
        return _.contains(ids, model.id);
      });
    };


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

      var headerView = new Header.views.LoggedIn({model: ia.currentUser});
      ia.listenTo(headerView, "logout", function(){
        window.location = "/logout";
      });

      ia.main.show(ia.layouts.app);
      ia.layouts.app.header.show(headerView);
    });

    // Since the portfolio list is so important to the app, let's go ahead
    // and create it.
    ia.addInitializer(function(){
      ia.portfolios = new Portfolio.collections.NavigationList(JSON.parse($('#bootstrapPortfolios').html()));
      ia.projects = new Project.collections.DataList(JSON.parse($('#bootstrapProjects').html()));
    });

    return ia;
  }
);
