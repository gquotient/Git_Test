define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'device',
  'chart',
  'issue',

  'hbs!layouts/devices/templates/core'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

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
      var documents = _.where(this.options.project.get('devdocs'), {
        graph_key: this.model.get('graph_key')
      });

      return {
        documents: documents
      };
    },

    regions: {
      powerAndIrradiance: '.chart.powerAndIrradiance',
      currentAndVoltage: '.chart.currentAndVoltage',
      children: '.chart.children',
      issues: '.issues'
    },

    onShow: function(){
      if (this.model.get('devtype') !== 'PV Array') {
        Backbone.history.navigate('/project/' + this.options.project.id + '/devices/' + this.model.get('graph_key'));
      } else {
        Backbone.history.navigate('/project/' + this.options.project.id + '/devices');
      }

      Backbone.trigger(
        'set:breadcrumbs',
        {
          model: this.options.model,
          state: 'device',
          display_name: this.options.model.get('devtype')+' '+this.options.model.get('did')
        }
      );

      this.buildCharts();

      if (this.model.get('devtype') !== 'Panel' && this.model.outgoing.length) {
        this.buildChildChart();
      }

      this.buildIssues();
    },

    buildIssues: function(){
      var project = this.options.project || this.model;

      // Build issues
      var issueView = new Issue.views.Table({
        project: project,
        collection: project.issues,
        filter: { identifier: this.model.get('graph_key') }
      });

      // Update issues
      project.issues.fetch();

      this.issues.show(issueView);
    },

    buildCharts: function(){
      var project = this.options.project,
        date = this.options.date;

      var powerAndIrradiance = new Chart.views.Basic({
        traces: [
          Chart.dataDefaults(project, this.model, 'irradiance', date),
          Chart.dataDefaults(project, this.model, 'power', date)
        ],
        series: [
          Chart.seriesDefaults.irradiance,
          Chart.seriesDefaults.power
        ]
      });

      var currentAndVoltage = new Chart.views.Basic({
        traces: [
          Chart.dataDefaults(project, this.model, 'current', date),
          Chart.dataDefaults(project, this.model, 'voltage', date)
        ],
        series: [
          Chart.seriesDefaults.current,
          Chart.seriesDefaults.voltage
        ]
      });

      this.powerAndIrradiance.show(powerAndIrradiance);
      this.currentAndVoltage.show(currentAndVoltage);
    },

    buildChildChart: function(){
      var
        that = this,
        traces = [],
        series = [],
        date = this.options.date,
        project = this.options.project,
        // Don't show these devices in charts
        filter = [
          'AC Bus',
          'SPT Site Server',
          'Site Server',
          'SPT Gateway',
          'Generation Meter'
        ]
      ;

      project.findDataSources().done(function(dataSources){
        // Loop through child nodes
        that.model.outgoing.each(function(child, index){
          // Make sure it's not a filtered device
          if (_.indexOf(filter, child.get('devtype')) < 0) {
            // Special case the inverter logic
            if (child.get('devtype') === 'Inverter') {
              if (dataSources.inverter.ac_power) {
                traces.push({
                  'project_label': project.id,
                  'ddl': 'inv',
                  'dtstart': date ? date.start/1000 : 'today',
                  'dtstop': date ? date.stop/1000 : 'now',
                  'columns': ['freezetime', 'ac_power_mean'],
                  'filters': [
                    {
                      'column': 'identifier',
                      'in_set': [child.get('graph_key')]
                    }
                  ],
                  project_timezone: project.get('timezone')
                });
              } else if (dataSources.inverter.bus) {
                traces.push({
                  'project_label': project.id,
                  'ddl': 'inv-bus-calc',
                  'dtstart': date ? date.start/1000 : 'today',
                  'dtstop': date ? date.stop/1000 : 'now',
                  'columns': ['freezetime', 'dc_power'],
                  'filters': [
                    {
                      'column': 'identifier',
                      'in_set': [child.get('graph_key')]
                    }
                  ],
                  project_timezone: project.get('timezone')
                });
              }
            } else {
              // If not inverter, use the magic trace builder
              traces.push(Chart.dataDefaults(that.options.project, child, 'power', date));
            }

            // Custom series to show device ids in the legend
            series.push({
              name: 'Power (' + child.get('did') + ')',
              unit: 'W'
            });
          }
        });

        // Instantiate child chart
        var children = new Chart.views.Basic({
          traces: traces,
          series: series
        });

        // Unhide the div
        that.$('.children').show();

        // Show the chart
        that.children.show(children);
      });
    }
  });
});
