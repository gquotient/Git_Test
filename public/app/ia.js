define(
  
  [
    'jquery',

    'backbone',
    'backbone.marionette',
    "backbone.marionette.handlebars",

    "app/modules/user/user",
    "app/modules/header/header",

    "hbs!app/layouts/index"
  ],
  
  function($, Backbone, Marionette, MarionetteHandlebars, User, Header, indexTemplate){

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
      }
    };

    var ia = new Backbone.Marionette.Application();

    ia.addRegions({
      main: "#ia"
    });

    ia.setState = function(state){
      states[state]();
    };

    ia.setLayout = function(layout){
      ia.main.show(ia.mainLayout);

      var currentUser = JSON.parse($('#currentUserData').html());

      var headerView = new Header.views.LoggedIn({model: currentUser});

      headerView.on("logout", function(){
        window.location = "logout";
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
