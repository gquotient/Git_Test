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
      content: '.contentContainer',
      overlay: '.overlayContainer'
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
      this.content.show( new Device.views.Canvas({collection: this.model.devices}) );
    },

    onClose: function(){
      this.undelegateEditorEvents();
    },

    initialize: function(options){
      this.model = options.model;

      // Set up events on document.
      this.$doc = $(document);
      this.delegateEditorEvents();

      // Set up listeners
      this.listenTo(Backbone, 'select:portfolio', function(model){
        // Set address bar and force routing
        Backbone.history.navigate('/portfolio/' + model.id, true);
      });

      this.listenTo(Backbone, 'select:project', function(model){
        // Set address bar and force routing
        Backbone.history.navigate('/project/' + model.id, true);
      });
    }
  });
});
