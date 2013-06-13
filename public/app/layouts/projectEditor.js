define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'project',
  'device',

  'hbs!layouts/templates/projectEditor'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Project,
  Device,

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
    },

    onShow: function(){
      this.overlay.show( new Project.views.Editor({model: this.model}) );
    },

    onClose: function(){
      this.undelegateEditorEvents();
    },

    initialize: function(options){
      this.model = options.model;

      // Fetch additional project information for editing.
      this.model.fetch({data: {
        project_label: this.model.get('label'),
        index: 'AlignedProjects'
      }});

      // Set up events on document.
      this.$doc = $(document);
      this.delegateEditorEvents();

      // Set up listeners
      this.listenTo(Backbone, 'editor:rendering', function(label){
        this.content.show( new Device.views.Canvas({
          collection: this.model.devices,
          rendering_label: label
        }));
      });
    }
  });
});
