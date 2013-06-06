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
      banner: '#banner',
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

      this.banner.show(notification);

      notification.on('close', function(){
        $('#page').removeClass('withBanner');
      });
    },

    initialize: function(options){
      // Build header
      this.headerView = new Header({model: options.currentUser});

      // Build navigation
      this.navigationView = new Navigation();

      // Special page settings handling
      this.pageSettings.on('show', function(){
        this.$el.addClass('active');
      });

      this.pageSettings.on('close', function(){
        this.$el.removeClass('active');
      });

      // Special notification banner handling
      this.banner.on('show', function(){
        $('#page').addClass('withBanner');
      });
    }
  });
});
