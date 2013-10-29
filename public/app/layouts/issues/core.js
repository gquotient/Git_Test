define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',

  'project',
  'device',
  'chart',
  'issue',

  'hbs!layouts/issues/templates/core'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  ia,

  Project,
  Device,
  Chart,
  Issue,

  CoreTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: CoreTemplate
    },
    templateHelpers: function(){
      // Since we need the project info, we need to return a special context
      // to our template
      return {
        project: this.options.project.toJSON(),
        alarm: this.model.toJSON(),
        contactInfo: this.options.contactInfo.toJSON()
      };
    },
    regions: {
      chart: '.chart',
      deviceName: '.deviceName'
    },
    triggers: {
      'click .acknowledge': 'acknowledge',
      'click .resolve': 'resolve',
      'click .delete': 'delete'
    },
    events: {
      'click .device': function(event){
        event.preventDefault();
        Backbone.history.navigate('/project/' + this.project.id + '/devices/' + this.device.get('graph_key'), true);
      }
    },
    onAcknowledge: function(){
      this.model.acknowledge(ia.currentUser.get('email'));
    },
    onResolve: function(){
      var that = this;
      // Resolve the alarm
      this.model.resolve().done(function(){
        // And navigate back to main issues page
        Backbone.history.navigate('/project/' + that.options.project.id + '/issues', true);
      });
    },
    onDelete: function(){
      // Confirm user actually wants to delete the alarm
      var confirm = window.confirm('Are you sure you want to delete this alarm?');

      // If confirm returns true, destroy model
      if (confirm) {
        this.model.destroy();
      }
    },
    modelEvents: {
      'change': 'render'
    },
    onShow: function(){
      Backbone.trigger(
        'set:breadcrumbs',
        {
          model: this.options.model,
          state: 'issue',
          display_name: this.options.model.get('display_name')
        }
      );

      // This stuff needs to be in the onShow because it needs the dom elements to work
      var that = this,
        project = this.options.project;

        console.log(project, that.model);

      var initialView = function(){
        that.device = project.devices.findWhere({graph_key: that.model.get('identifier')});
        that.buildChart();
      };
      // Fetch project to get devices
      if (project.devices.length) {
        initialView();
      } else {
        project.fetch({data: {project_label: project.id}}).done(initialView);
      }
    },

    buildChart: function(){
      var
        project = this.options.project,
        device = this.device,
        // Add an hour to either side of time range
        startTime = this.model.get('fault_start') - (60 * 60),
        stopTime = this.model.get('fault_stop') + (60 * 60),
        localTime = this.model.getLocalDate()
      ;

      // Add link to device
      this.$el.find('.deviceName').html('<a href="#' + device.get('graph_key') + '" class="device">' + device.get('did') + '</a>');

      // Instantiate chart
      var chart_powerAndIrradiance = new Chart.views.Basic({
        autoUpdate: false,
        chartOptions: {
          xAxis: {
            plotBands: {
              color: 'rgba(201, 77, 30, 0.1)',
              from: localTime.start,
              to: localTime.stop
            }
          }
        },
        traces: [
          {
            'project_label': project.id,
            'ddl': 'pgen-env',
            'dtstart': startTime,
            'dtstop': stopTime,
            'columns': ['freezetime', 'irradiance'],
            project_timezone: project.get('timezone')
          },
          {
            'project_label': project.id,
            'ddl': this.model.get('device_type'),
            'dtstart': startTime,
            'dtstop': stopTime,
            'columns': ['freezetime', this.model.get('device_column')],
            'filters': [
              {
                'column': 'identifier',
                'in_set': [device.get('graph_key')]
              }
            ],
            project_timezone: project.get('timezone')
          }
        ],
        series: [
          Chart.seriesDefaults.irradiance,
          Chart.seriesDefaults.power
        ]
      });

      this.chart.show(chart_powerAndIrradiance);
    }
  });
});
