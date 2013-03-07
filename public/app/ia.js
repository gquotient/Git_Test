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
          all: portfolioSet.all
        });

        var detailLayout = new Portfolio.layouts.detailOverview();

        ia.mainLayout.contentNavigation.show(portfolioNavigationView);
        ia.mainLayout.mainContent.show(detailLayout);

      }
    };

    var ia = new Backbone.Marionette.Application();

    ia.addRegions({
      main: "#ia"
    });

    ia.setState = function(state, arg){
      states[state](arg);
    };

    ia.setLayout = function(layout){
      ia.main.show(ia.mainLayout);

      var currentUser = JSON.parse($('#currentUserData').html());

      var headerView = new Header.views.LoggedIn({model: currentUser});

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
