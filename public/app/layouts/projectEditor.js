define([
  'backbone',
  'backbone.marionette',
  'paper',

  'project',

  'hbs!layouts/templates/projectEditor'
], function(
  Backbone,
  Marionette,
  paper,

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
      overlay: '#overlayContainer'
    },

    onShow: function(){
      var scope = paper.setup(this.$('#projectCanvas')[0]);
      this.overlay.show( new Project.views.Editor({model: this.model, paperScope: scope}) );
    },

    initialize: function(options){
      this.model = options.model;

      // Populating the devices collection here for lack of a better place.
      this.model.devices.fetch();

      // Set up listeners
      this.listenTo(Backbone, 'select:portfolio', function(model){
        // Set address bar and force routing
        Backbone.history.navigate('/portfolio/' + model.get('id'), true);
      });

      this.listenTo(Backbone, 'select:project', function(model){
        // Set address bar and force routing
        Backbone.history.navigate('/project/' + model.get('id'), true);
      });
    }
  });
});
