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

    initialize: function(options){
      // Make sure the project has a label and devices.
      this.checkProject(options.model);

      // Create the editor view.
      this.editorView = new Project.views.Editor(options);

      // Set up view listener.
      this.listenTo(Backbone, 'editor:change:view', function(options){
        if (options.View && options.uri) {
          this.content.show( new options.View(_.omit(options, 'View')) );
          this.updateHistory(options.uri);
        }
      });
    },

    onShow: function(){
      this.overlay.show(this.editorView);
    },

    checkProject: function(project){
      var promise;

      // If the project does not have a label then fetch all the projects.
      if (!project.has('project_label')) {
        promise = project.collection.fetchFromAllIndices();
      } else {
        promise = $.Deferred().resolve().promise();
      }

      // Once complete, fetch devices if empty.
      promise.done(function(){
        if (!project.devices.length && project.has('project_label')) {
          project.fetch();
        }
      });
    },

    updateHistory: function(uri){
      var fragment = Backbone.history.fragment;
      Backbone.history.navigate(fragment.replace(/[^\/]+$/, uri));
    }
  });
});
