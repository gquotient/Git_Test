define([
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'message',

  'layouts/header',
  'layouts/navigation',

  'hbs!layouts/templates/index'
], function(
  $,
  Backbone,
  Marionette,
  Handlebars,

  Message,

  Header,
  Navigation,

  indexTemplate
){
  // MAIN LAYOUT/CONTROLLER
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: indexTemplate
    },

    regions: {
      header: '#header',
      notificationBanner: '#notificationBanner',
      navigation: '#nav_page',
      mainContent: '#page'
    },

    onShow: function(){
      this.header.show(this.headerView);
      this.navigation.show(this.navigationView);

      this.toggleNotificationBanner();
    },

    toggleNotificationBanner: function(message){
      var
        that = this,
        notification = new Message.views.notificationBanner()
      ;

      this.notificationBanner.show(notification);

      this.listenTo(notification, 'close', function(){
        $('#page').removeClass('withBanner');
      });

      $('#page').addClass('withBanner');
    },

    initialize: function(app){
      this.app = app;

      // Build header
      this.headerView = new Header({model: app.currentUser});

      // Build navigation
      this.navigationView = new Navigation();
    }
  });
});
