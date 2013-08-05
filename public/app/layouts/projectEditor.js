define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'project',
  'equipment',

  'hbs!layouts/templates/projectEditor'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Project,
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
      $.when(this.equipment.fetch(), this.model.setLock()).always(function(){
        that.model.fetch({
          data: {
            index_name: 'AlignedProjects/no'
          },
          equipment: that.equipment
        });
      });

      // Set up view listener.
      this.listenTo(Backbone, 'editor:change:view', function(options){
        if (options.View) {
          this.content.show( new options.View(_.omit(options, 'View')) );
        }

        this.updateHistory(options.uri);
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
      this.overlay.show( new Project.views.Editor({
        model: this.model,
        equipment: this.equipment,
        user: this.options.user,
        view: this.options.view
      }));
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
