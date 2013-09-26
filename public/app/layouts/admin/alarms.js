define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',

  'issue',

  'layouts/admin/alarms/projectAlarms',

  'hbs!layouts/admin/templates/alarms'
], function(
  _,
  $,
  Backbone,
  Marionette,
  Handlebars,

  ia,

  Issue,

  ProjectAlarmsLayout,

  alarmsTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: alarmsTemplate
    },
    regions: {
      alarmsAdmin: '.alarmsAdmin'
    },
    showProjectAlarms: function(id){
      var project = this.options.projects.findWhere({project_label: id});
      var projectAlarmsLayout = new ProjectAlarmsLayout({collection: this.options.projects});

      this.alarmsAdmin.show(projectAlarmsLayout);

      if (project) {
        projectAlarmsLayout.selectProject(project);
      }

      this.listenTo(projectAlarmsLayout, 'editConditions', function(alarm){
        this.showEditAlarm(alarm);
      });
    },
    showEditAlarm: function(alarm){
      var project = this.options.projects.findWhere({project_label: alarm.collection.project.id});
      var alarmId = alarm.id || alarm.get('alarm_type');

      // Update history
      Backbone.history.navigate('/admin/alarms/' + project.id + '/' + alarmId);
      Backbone.trigger('set:breadcrumbs', {state: 'alarmEdit', display_name: alarm.get('alarm_type')});

      var editAlarmView = new Issue.views.AlarmSingleEdit({
        model: alarm,
        project: project,
        user: ia.currentUser
      });

      this.alarmsAdmin.show(editAlarmView);
    },
    onShow: function(){
      this.showProjectAlarms();
    }
  });
});
