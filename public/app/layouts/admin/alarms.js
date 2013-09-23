define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',

  'issue',

  'layouts/admin/alarms/projectAlarms',
  'layouts/admin/alarms/editAlarm',

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
  EditAlarmLayout,

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
      console.log(alarm);
      // Update history
      Backbone.history.navigate('/admin/alarms/' + alarm.collection.project.id + '/' + alarm.get('alarm_type'));

      var editAlarmLayout = new EditAlarmLayout({
        model: alarm,
        project: this.options.projects.findWhere({project_label: alarm.collection.project.id })
      });

      this.alarmsAdmin.show(editAlarmLayout);
    },
    onShow: function(){
      this.showProjectAlarms();
    }
  });
});
