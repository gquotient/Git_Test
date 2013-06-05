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
      breadcrumbs: '#breadcrumbs',
      pageSettings: '#pageSettings',
      mainContent: '#page'
    },

    onShow: function(){
      this.header.show(this.headerView);
      this.breadcrumbs.show(this.navigationView);

      //this.toggleNotificationBanner();
    },

    toggleNotificationBanner: function(){
      var notification = new Message.views.notificationBanner();

      this.notificationBanner.show(notification);

      // This class affects the height of the main content container
      $('#page').addClass('withBanner');

      // This listener will have to be somewhere smarter
      this.listenTo(notification, 'close', function(){
        $('#page').removeClass('withBanner');
      });
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
