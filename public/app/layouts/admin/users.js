define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',

  'user',
  // 'team',
  // 'organization',

  './base'
], function(
  _,
  $,
  Backbone,
  Marionette,
  Handlebars,

  ia,

  User,

  BaseLayout
){

  return BaseLayout.extend({
    onShow: function(){
      this.pageContent.show(this.view);
    },

    initialize: function(options){
      // Refresh breadcrumbs
      Backbone.trigger('reset:breadcrumbs', {
        state:'admin',
        display_name: 'Admin',
        url: '/admin'
      });

      Backbone.trigger('set:breadcrumbs', {
        state:'users',
        display_name:'Users',
        url: '/admin/users'
      });

      this.collection = new User.Collection();
      this.view = new User.views.EditTable({ collection: this.collection });

      // Update history
      Backbone.history.navigate('/admin/users');
    }
  });

});
