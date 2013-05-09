define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'jquery.mousewheel',

  'project',
  'device',

  'hbs!layouts/templates/projectEditor'
], function(
  $,
  _,
  Backbone,
  Marionette,
  wheel,

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

      _.each(['keydown', 'keypress', 'mousewheel', 'mousemove', 'mouseup'], function(eventName){
        this.$doc.on(eventName + '.editorEvent' + this.cid, function(){
          var args = Array.prototype.slice.apply(arguments);
          args.unshift('editor:' + eventName);
          Backbone.trigger.apply(Backbone, args);
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

      // Populating the devices collection here for lack of a better place.
      this.model.devices.fetch();

      // Set up events on document.
      this.$doc = $(document);
      this.delegateEditorEvents();

      // Set up listeners
      this.listenTo(Backbone, 'select:portfolio', function(model){
        // Set address bar and force routing
        Backbone.history.navigate('/portfolio/' + model.get('id'), true);
      });

      this.listenTo(Backbone, 'select:project', function(model){
        // Set address bar and force routing
        Backbone.history.navigate('/project/' + model.get('id'), true);
      });
    }
  });
});
