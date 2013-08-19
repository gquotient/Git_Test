define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'project',

  'hbs!layouts/templates/projectEditor'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Project,

  projectEditorTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: projectEditorTemplate
    },

    attributes: {
      id: 'page-projectEditor'
    },

    regions: {
      content: '#content',
      overlay: '#overlay'
    },

    initialize: function(){

      // Set up view listener.
      this.listenTo(Backbone, 'editor:change:view', function(options){
        if (options.View && options.uri) {
          this.content.show( new options.View(_.omit(options, 'View')) );
          this.updateHistory(options.uri);
        }
      });
    },

    updateHistory: function(uri){
      var fragment = Backbone.history.fragment;

      Backbone.history.navigate(fragment.replace(/[^\/]+$/, uri));
    },

    onShow: function(){
      this.overlay.show( new Project.views.Editor(this.options) );
    }
  });
});
