define(
  [
    'backbone',
    'backbone.marionette',
    'backbone.marionette.handlebars',

    'hbs!app/modules/header/templates/logged_in'
  ],
  function(Backbone, Marionette, MarionetteHandlebars, loggedInTemplate){
    var Header = { views: {} };

    Header.views.LoggedIn = Backbone.Marionette.ItemView.extend({
      template: {
        type: 'handlebars',
        template: loggedInTemplate
      },

      serializeData: function(){
        return this.model;
      },

      triggers: {
        "click .logout": "logout"
      }
    });

    return Header;
  }
);