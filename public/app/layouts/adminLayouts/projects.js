define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',

  'project',

  './base'
], function(
  _,
  $,
  Backbone,
  Marionette,

  Project,

  BaseLayout
){
  return BaseLayout.extend({
    onShow: function(){
      this.pageContent.show( new Project.views.AdminList({
        collection: this.collection
      }));
    },

    initialize: function(options){
      this.collection.fetch({
        data: {
          index_name: 'AlignedProjects'
        }
      });
    }
  });
});
