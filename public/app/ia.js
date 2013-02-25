define(
  
  [
    'backbone',
    'backbone.marionette',

    "hbs!app/layouts/index"
  ],
  
  function(Backbone, Marionette, indexTemplate){

    var states = {
      "index": { },
      "users": { }
    };

    var ia = new Backbone.Marionette.Application();

    ia.addRegions({
      main: "#ia"
    });

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


    ia.setState = function(state){

    };

    return ia;
  }

);
