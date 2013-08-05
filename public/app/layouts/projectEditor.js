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
      this.$doc = $(document);

      // Set up view listener.
      this.listenTo(Backbone, 'editor:change:view', function(options){
        if (options.View) {
          this.content.show( new options.View(_.omit(options, 'View')) );
        }

        this.updateHistory(options.uri);
      });
    },

    updateHistory: function(uri){
      var parts = Backbone.history.fragment.split('/'),
        last = _.last(parts);

      if (last !== 'edit' && last !== 'view') {
        parts.pop();
      }

      if (uri) {
        parts.push(uri);
      }

      Backbone.history.navigate(parts.join('/'));
    },

    onShow: function(){
      this.delegateEditorEvents();
      this.overlay.show( new Project.views.Editor(this.options) );
    },

    onClose: function(){
      this.undelegateEditorEvents();
    },

    delegateEditorEvents: function(){
      this.undelegateEditorEvents();

      _.each(['keydown', 'keypress', 'mousemove', 'mouseup'], function(eventName){
        this.$doc.on(eventName + '.editorEvent' + this.cid, function(e){
          Backbone.trigger('editor:' + eventName, e);
        });
      }, this);
    },

    undelegateEditorEvents: function(){
      this.$doc.off('.editorEvent' + this.cid);
    }
  });
});
