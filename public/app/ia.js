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

    var states = {
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

    var ia = new Backbone.Marionette.Application();

    /* Create a new user instance that is the current session user */
    var currentUser = User.Model.extend(JSON.parse($('#currentUserData').html()));
    ia.currentUser = new currentUser();

    ia.addRegions({
      main: "#ia"
    });

    ia.setState = function(state, arg){
      states[state](arg);
    };

    ia.setLayout = function(layout){
      console.log('set layout', ia);
      ia.main.show(ia.mainLayout);

      var headerView = new Header.views.LoggedIn({model: ia.currentUser});

      headerView.on("logout", function(){
        window.location = "/logout";
      });

      ia.mainLayout.header.show(headerView);

    };

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

    return ia;
  }

);
