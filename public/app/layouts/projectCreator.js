define([
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',
  'project',

  'hbs!layouts/templates/projectCreator'
], function(
  Backbone,
  Marionette,
  Handlebars,

  ia,
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
      this.model = new Project.Model();

      // Set up listeners
      this.listenTo(Backbone, 'create:project', function(model){
        ia.projects.addProject(model);
        Backbone.trigger('reset:breadcrumbs', model);
        Backbone.history.navigate('/project/' + model.id + '/edit', true);
      });
    }
  });
});
