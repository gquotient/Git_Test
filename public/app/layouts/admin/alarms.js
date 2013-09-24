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
      var projectAlarmsLayout = new ProjectAlarmsLayout({projects: this.options.projects});

      this.alarmsAdmin.show(projectAlarmsLayout);

      if (id) {
        projectAlarmsLayout.selectProject(this.options.projects.findWhere({project_label: id}));
      }

      this.listenTo(projectAlarmsLayout, 'editConditions', function(alarm){
        this.showEditAlarm(alarm);
      });
    },
    showEditAlarm: function(alarm){
      var alarmId = alarm.id || alarm.get('alarm_type');

      // Update history
      Backbone.history.navigate('/admin/alarms/' + alarm.collection.project.id + '/' + alarmId);

      var editAlarmView = new Issue.views.AlarmSingleEdit({
        model: alarm,
        project: this.options.projects.findWhere({project_label: alarm.collection.project.id }),
        user: ia.currentUser
      });

      this.alarmsAdmin.show(editAlarmView);
    },
    onShow: function(){
      this.showProjectAlarms();
    }
  });
});
