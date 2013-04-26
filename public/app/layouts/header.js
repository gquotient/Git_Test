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
      'click .profile': 'profile',
      'click .admin': 'admin'
    },
    initialize: function(){
      this.listenTo(this, 'logout', function(){
        window.location = '/logout';
      });

      this.listenTo(this, 'profile', function(){
        Backbone.history.navigate('/profile', true);
      });

      this.listenTo(this, 'admin', function(){
        Backbone.history.navigate('/admin', true);
      });
    }
  });
});
