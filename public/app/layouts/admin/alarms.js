define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',

  'issue',

  'hbs!layouts/admin/templates/alarms'
], function(
  _,
  $,
  Backbone,
  Marionette,
  Handlebars,

  ia,

  Issue,

  alarmsTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: alarmsTemplate
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

      var projectAlarmsView = new Issue.views.AlarmTemplateTable({
        collection: new Issue.TemplateCollection([], {project: project})
      });

      projectAlarmsView.collection.fetch();

      // Select the correct value for the select box
      if (this.ui.selectProject.val() !== project.id) {
        this.ui.selectProject.val(project.id);
      }

      this.projectAlarms.show(projectAlarmsView);

      this.listenTo(projectAlarmsView, 'itemview:addCondition', function(alarmView){
        this.selectAlarm(alarmView.model);
      });
    },
    selectAlarm: function(alarm){
      // Update history
      Backbone.history.navigate('/admin/alarms/' + alarm.collection.project.id + '/' + alarm.get('alarm_type'));

      var alarmEditView = new Issue.views.AlarmTemplateEdit({model: alarm});

      this.projectAlarms.show(alarmEditView);
      console.log('selectAlarm', alarm);
    },
    events: {
      'change select.project': function(event){
        this.projectAlarms.close();

        // Get project from selected id
        var project = this.options.projects.findWhere({
          project_label: event.target.value
        });

        if (project) {
          this.selectProject(project);
        }
      }
    },
    serializeData: function(){
      return {
        projects: this.options.projects.toJSON()
      };
    }
  });
});
