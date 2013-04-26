define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'hbs!layouts/templates/header'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  headerTemplate
){
  return Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: headerTemplate
    },
    triggers: {
      'click .logout': 'logout',
      'click .profile': 'profile'
    },
    initialize: function(){
      this.listenTo(this, 'logout', function(){
        window.location = '/logout';
      });

      this.listenTo(this, 'profile', function(){
        Backbone.history.navigate('/profile', true);
      });
    }
  });
});
