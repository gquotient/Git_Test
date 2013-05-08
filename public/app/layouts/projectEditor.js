define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'paper',
  'jquery.mousewheel',

  'project',
  'device',

  'hbs!layouts/templates/projectEditor'
], function(
  $,
  _,
  Backbone,
  Marionette,
  paper,
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
      overlay: '#overlayContainer'
    },

    delegateEditorEvents: function(){
      this.undelegateEditorEvents();

      _.each(['keydown', 'keypress', 'mousewheel'], function(eventName){
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
      var scope = paper.setup(this.$('#projectCanvas')[0]);

      this.editorView = new Project.views.Editor({model: this.model, paper: scope});
      this.overlay.show(this.editorView);

      this.devicesView = new Device.views.PaperCollection({collection: this.model.devices, paper: scope});
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
