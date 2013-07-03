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
      this.createProject.show(this.creator);
    },

    initialize: function(options){

      // Create creator view.
      this.creator = new Project.views.Create({
        model: new Project.Model(),
        user: options.user
      });

      // Set up listeners.
      this.listenTo(Backbone, 'create:project', function(project){
        options.projects.add(project);
        Backbone.history.navigate('/project/' + project.id + '/edit', true);
      });
    }
  });
});
