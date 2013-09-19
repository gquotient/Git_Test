define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',

  'layouts/admin/alarms/projectAlarms',

  'hbs!layouts/admin/templates/alarms'
], function(
  _,
  $,
  Backbone,
  Marionette,
  Handlebars,

  ia,

  ProjectAlarmsLayout,

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
      var that = this,
        projectAlarmsLayout;

      // Update history
      Backbone.history.navigate('/admin/alarms/' + project.id);

      // Select the correct value for the select box
      if (this.ui.selectProject.val() !== project.id) {
        this.ui.selectProject.val(project.id);
      }

      // Append loading indicator
      this.ui.projectAlarms.append('<span class="loadingIndicator"></span>');

      // Get the alarm templates
      $.ajax({
        url: '/api/project_alarms',
        dataType: 'json',
        data: {
          project_label: project.get('project_label')
        }
      })
      .done(function(alarms){
        console.log(alarms);
        projectAlarmsLayout = new ProjectAlarmsLayout({
          model: project,
          alarms: alarms
        });

        that.projectAlarms.show(projectAlarmsLayout);
      });
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
