define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',

  'ia',

  'issue',

  'hbs!layouts/admin/alarms/templates/projectAlarms'
], function(
  _,
  $,
  Backbone,
  Marionette,

  ia,

  Issue,

  projectAlarmsTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: projectAlarmsTemplate
    },
    regions: {
      projectAlarms: '.projectAlarms'
    },
    ui: {
      projectAlarms: '.projectAlarms',
      selectProject: 'select.project'
    },
    selectProject: function(project){
      // Update history
      Backbone.history.navigate('/admin/alarms/' + project.id);
      Backbone.trigger('set:breadcrumbs', {
        state: 'projectAlarms',
        display_name: project.get('display_name'),
        url: '/admin/alarms/' + project.id
      });

      var projectAlarmsView = new Issue.views.AlarmTemplateTable({
        collection: new Issue.TemplateCollection([], {project: project})
      });

      // Select the correct value for the select box
      if (this.ui.selectProject.val() !== project.id) {
        this.ui.selectProject.val(project.id);
      }

      this.projectAlarms.show(projectAlarmsView);

      projectAlarmsView.collection.fetch();

      this.listenTo(projectAlarmsView, 'itemview:editConditions', function(alarmView){
        this.trigger('editConditions', alarmView.model);
      });
    },
    events: {
      'change select.project': function(event){
        this.projectAlarms.close();

        // Get project from selected id
        var project = this.collection.findWhere({
          project_label: event.target.value
        });

        if (project) {
          this.selectProject(project);
        }
      }
    }
  });
});
