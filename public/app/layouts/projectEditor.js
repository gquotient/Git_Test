define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'project',
  'device',
  'equipment',

  'hbs!layouts/templates/projectEditor'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Project,
  Device,
  Equipment,

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
      this.overlay.show( new Project.views.Editor({
        model: this.model,
        equipment: this.equipment
      }));
    },

    onClose: function(){
      this.undelegateEditorEvents();
    },

    initialize: function(options){
      var model = this.model = options.model,
        equipment = this.equipment = new Equipment.Collection();

      if (!(model instanceof Backbone.Model)) {
        model = this.model = new Project.Model(model);
      }

      equipment.fetch().done(function(){
        model.fetch({
          data: {
            project_label: model.get('label'),
            index: 'AlignedProjects/no'
          },
          equipment: equipment
        });
      });

      // Set up events on document.
      this.$doc = $(document);
      this.delegateEditorEvents();

      // Set up listeners.
      this.listenTo(Backbone, 'editor:change:view', function(label){
        var view;

        if (label === 'CHANGELOG') {
          view = new Project.views.ChangeLog({
            model: this.model
          });
        } else {
          view =  new Device.views.Canvas({
            collection: this.model.devices,
            rendering: label,
            editable: true
          });
        }

        if (view) {
          this.content.show(view);
        }
      });
    }
  });
});
