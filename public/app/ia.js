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

    /* This is some bullshit hackery */
    ia.states = {
      portfolios: function(portfolioSet){
        var portfolioNavigationView = new Portfolio.views.NavigationListView({
          collection: portfolioSet.collection,
          model: portfolioSet.model,
          basePortfolios: portfolioSet.all
        });

        var detailLayout = new Portfolio.layouts.detailOverview();

        ia.mainLayout.contentNavigation.show(portfolioNavigationView);
        ia.mainLayout.mainContent.show(detailLayout);

      }
    };

    ia.setState = function(state, arg){
      ia.states[state](arg);
    };

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


    /* Some app on initialization. Breaking it up for clarity. */

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

      ia.mainLayout = new AppLayout();
      ia.headerView = new Header.views.LoggedIn({model: ia.currentUser});

      ia.headerView.on("logout", function(){
        window.location = "/logout";
      });

      ia.mainLayout.header.show(ia.headerView);
      ia.main.show(ia.mainLayout);
    });

    return ia;
  }
);
