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
    events: {
      'click a': function(event){
        event.preventDefault();

        var route = event.target.hash.replace('#', '');

        Backbone.history.navigate('/' + route, true);
      }
    },
    triggers: {
      'click .logout': 'logout',
      'change select': 'select:team'
    },
    initialize: function(){
      this.listenTo(this, 'logout', function(){
        window.location = '/logout';
      });

      this.listenTo(this.model, 'change', function(){
        this.render();
      });

      this.listenTo(this, 'select:team', function(options){
        Backbone.trigger('select:team', options.view.$el.find('select').val());
      })
    }
  });
});
