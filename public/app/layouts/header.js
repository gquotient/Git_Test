define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'notification',

  'hbs!layouts/templates/header'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  Notification,

  headerTemplate
){
  return Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: headerTemplate
    },
    regions: {
      notifications: '.notifications'
    },
    events: {
      'click a': function(event){
        event.preventDefault();

        var route = event.target.pathname;

        Backbone.history.navigate(route, true);
      }
    },
    triggers: {
      'change select': 'select:team'
    },
    onShow: function(){
      var notificationView = new Notification.views.DropDown({
        collection: new Notification.Collection()
      });

      this.notifications.show(notificationView);
    },
    initialize: function(){
      this.listenTo(this.model, 'change', function(){
        this.render();
      });

      this.listenTo(this, 'select:team', function(options){
        Backbone.trigger('select:team', options.view.$el.find('select').val());
      });
    }
  });
});
