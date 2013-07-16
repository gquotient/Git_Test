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
      this.collection = new User.Collection();
      this.view = new User.views.EditTable({ collection: this.collection });
      this.collection.fetch();

      // Update history
      Backbone.history.navigate('/admin/users');
    }
  });

});
