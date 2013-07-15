define([
  'backbone',
  'backbone.marionette',
  'handlebars',

  'project',

  'hbs!layouts/templates/projectCreator'
], function(
  Backbone,
  Marionette,
  Handlebars,

  Project,

  projectCreatorTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: projectCreatorTemplate
    },

    attributes: {
      class: 'basicView',
      id: 'page-projectCreator'
    },

    regions: {
      createProject: '#createProject'
    },

    onShow: function(){
      this.createProject.show( new Project.views.Create({
        collection: this.collection,
        user: this.options.user
      }));
    }
  });
});
