define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',

  'hbs!layouts/admin/templates/alarms'
], function(
  _,
  $,
  Backbone,
  Marionette,
  Handlebars,

  ia,

  alarmsTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: alarmsTemplate
    },
    initialize: function(options) {
      // Update breadcrumbs
      Backbone.trigger('reset:breadcrumbs', {
        state:'admin',
        display_name: 'Admin'
      });

      Backbone.trigger('set:breadcrumbs', {state:'alarms', display_name:'Alarms'});

      // Update history
      Backbone.history.navigate('/admin/alarms');
    },
    selectProject: function(project){
      $.ajax({
        url: '/api/project_alarms',
        data: {
          project_label: project.get('project_label')
        }
      })
      .always(function(){console.log(arguments);});
    },
    events: {
      'change select.project': function(event){
        // Get project from selected id
        var project = this.options.projects.findWhere({
          project_label: event.target.value
        });

        this.selectProject(project);
      }
    },
    serializeData: function(){
      return {
        projects: this.options.projects.toJSON()
      };
    }
  });
});