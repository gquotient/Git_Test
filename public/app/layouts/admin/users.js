define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',

  'user',

  './base'
], function(
  _,
  $,
  Backbone,
  Marionette,

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
    }
  });
});
