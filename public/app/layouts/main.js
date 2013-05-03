define([
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'layouts/header',
  'layouts/navigation',

  'hbs!layouts/templates/index'
], function(
  $,
  Backbone,
  Marionette,
  Handlebars,

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
      navigation: '#nav_page',
      mainContent: '#page'
    },

    onShow: function(){
      this.header.show(this.headerView);
      this.navigation.show(this.navigationView);
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
