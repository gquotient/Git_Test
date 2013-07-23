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

    initialize: function(options){
      var that = this;

      this.$doc = $(document);
      this.equipment = new Equipment.Collection();

      // Fetch equipment and project from server.
      this.equipment.fetch().done(function(){

        that.updateModel().fail(function(){
          that.model.makeEditable().done(function(){
            that.updateModel();
          });
        });
      });

      // Set up view listener.
      this.listenTo(Backbone, 'editor:change:view', function(args){
        var View = Project.views[args.view] || Device.views[args.view];

        if (View) {
          this.content.show( new View(args) );
        }
      });

      // Close the editor and release the lock after 5min of inactivity
      this.listenTo(Backbone, 'editor', _.throttle(function(){
        if (this.timer) {
          clearTimeout(this.timer);
        }

        this.timer = setTimeout(function(){
          Backbone.history.navigate('/admin/projects', true);
        }, 5 * 60 * 1000);
      }, 1000));
    },

    updateModel: function(){
      return this.model.fetch({
        data: {
          index_name: 'AlignedProjects/no'
        },
        equipment: this.equipment
      });
    },

    onShow: function(){
      var that = this;

      // Try to get a lock for this project before editing.
      this.model.setLock().always(function(data, stat){
        that.overlay.show( new Project.views.Editor({
          model: that.model,
          equipment: that.equipment,
          user: that.options.user,
          editable: stat === 'success' && JSON.parse(data).locked
        }));
      });

      this.delegateEditorEvents();
    },

    onClose: function(){

      // Release the lock for this project
      this.model.setLock(false);

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
