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

      // Set up view listener.
      this.listenTo(Backbone, 'editor:change:view', function(options){
        var isEmpty = !this.content.currentView;

        if (options.View) {
          this.content.show( new options.View(_.omit(options, 'View')) );
        }

        this.updateHistory(options.uri, {replace: isEmpty});
      });
    },

    updateHistory: function(uri, options){
      var parts = Backbone.history.fragment.split('/'),
        last = _.last(parts);

      if (last !== 'edit' && last !== 'view') {
        parts.pop();
      }

      if (uri) {
        parts.push(uri);
      }

      Backbone.history.navigate(parts.join('/'), options);
    },

    onShow: function(){
      this.overlay.show( new Project.views.Editor(this.options) );
    }
  });
});
