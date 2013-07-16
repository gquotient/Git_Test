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

    initialize: function(options){
      this.collection.fetch({
        data: {
          index_name: 'AlignedProjects'
        }
      });
    },

    onShow: function(){
      this.showList();
    },

    showList: function(){
      var view = new Project.views.AdminList({
        collection: this.collection
      });

      this.listenToOnce(view, 'create', this.showCreate);
      this.pageContent.show(view);
    },

    showCreate: function(){
      var view = new Project.views.AdminCreate({
        collection: this.collection,
        user: this.options.user
      });

      this.listenToOnce(view, 'close', this.showList);
      this.pageContent.show(view);
    }
  });
});
