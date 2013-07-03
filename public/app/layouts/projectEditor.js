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
      this.delegateEditorEvents();
      this.overlay.show(this.editor);
    },

    onClose: function(){
      this.undelegateEditorEvents();
    },

    initialize: function(options){
      var equipment = new Equipment.Collection(),
        model = options.model;

      if (_.isString(model)) {
        model = new Project.Model({project_label: model});
      }

      this.model = model;
      this.$doc = $(document);

      // Fetch equipment and project from server.
      equipment.fetch().done(function(){
        model.fetch({
          data: {
            project_label: model.id,
            index: 'AlignedProjects/no'
          },
          equipment: equipment
        });
      });

      // Create editor view.
      this.editor = new Project.views.Editor({
        model: model,
        equipment: equipment,
        user: options.user
      })

      // Set up view listener.
      this.listenTo(Backbone, 'editor:change:view', function(model){
        var View;

        if (model.get('name') === 'Change Log') {
          View = Project.views.ChangeLog;
        } else {
          View = Device.views.Canvas;
        }

        this.content.show( new View(model.toJSON()) );
      });
    }
  });
});
