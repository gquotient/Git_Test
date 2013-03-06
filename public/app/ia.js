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
      index: { },
      users: function(){
        var userView = new User.views.listView({
          collection: ia.users
        });

        // ia.main.show(ia.mainLayout);
        ia.mainLayout.contentNavigation.show(userView);

        userView.on("itemview:select:user", function(arg){
          var detailView = new User.views.detailView({model: arg.model});
          ia.mainLayout.mainContent.show(detailView);
        });
      },
      portfolios: function(portfolioSet){
        var portfolioNavigationView = new Portfolio.views.NavigationListView({
          collection: portfolioSet.collection,
          model: portfolioSet.model
        });

        ia.mainLayout.contentNavigation.show(portfolioNavigationView);

        portfolioNavigationView.on("itemview:select:portfolio", function(arg){
          var subPortfoliosIds = arg.model.get('subPortfolios');
          var subPortfolios = arg.model.collection.filter(function(model){
            return _.contains(subPortfoliosIds, model.id);
          });
          var newList = new Portfolio.collections.NavigationList(subPortfolios);

          Backbone.history.navigate("portfolios/"+arg.model.id);
          ia.setState("portfolios", {collection: newList, model: arg.model});
        });
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
