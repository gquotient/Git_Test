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
      this.createProject.show( new Project.views.Create({model: this.model}) );
    },

    initialize: function(options){
      var projects = options.projects;

      this.model = new Project.Model();

      // Set up listeners
      this.listenTo(Backbone, 'create:project', function(model){
        projects.add(model);
        Backbone.history.navigate('/project/' + model.id + '/edit', true);
      });
    }
  });
});
