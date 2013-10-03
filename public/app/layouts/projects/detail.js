define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',
  'device',
  'chart',
  'issue',

  'hbs!layouts/projects/templates/detail'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  Portfolio,
  Project,
  Device,
  Chart,
  Issue,

  detailTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: detailTemplate
    },
    regions: {
      map: '.map',
      devices: '.devices',
      kpis: '.kpis',
      issues: '.issues',
      chart_powerHistory: '.chart#powerHistory',
      chart_healthAndSoiling: '.chart#healthAndSoiling'
    },
    initialize: function(){
      // Check if devices need to be fetched
      if (!this.model.devices.length) {
        this.model.fetch({
          equipment: this.options.equipment
        });
      }

      this.listenTo(Backbone, 'click:issue', function(issue){
        var issueId = (issue === 'all') ? '' : '/' + issue.id;

        Backbone.history.navigate('/project/' + this.model.id + '/issues' + issueId, true);
      });

      this.listenTo(Backbone, 'click:device', function(device){
        Backbone.history.navigate('/project/' + this.model.id + '/devices/' + device.get('graph_key'), true);
      });
    },
    triggers: {
      'click .toggleView': 'toggle:view'
    },
    onToggleView: function(){
      if (this.currentView === 'map') {
        this.currentView = 'devices';
        $('.map').hide();
        $('.devices').show();
      } else {
        this.currentView = 'map';
        $('.devices').hide();
        $('.map').show();

        // When map is set to "display:none", marker renders messed up
        // This is a janky hack butso is all the rest of this map toggle tomfoolery
        if (this.mapView) {
          _.each(this.mapView.markers._layers, function(marker){
            marker.closePopup();
            marker.openPopup();
          });
        }
      }
    },
    onShow: function(){
      // Start with devices view hidden
      this.triggerMethod('toggle:view');

      // Build and display modules
      this.showCharts();
      this.showIssues();
      this.showKpis();
      this.showMap();
      this.showDevices();
      this.onToggleView();
    },
    showCharts: function(){
      var that = this,
        project = this.model;

      // Build charts
      this.model.findDataSources().done(function(dataSources){
        var chart_powerHistory = new Chart.views.Basic({
          chartOptions: {
            title: {
              text: 'Current Performance'
            }
          },
          traces: [
            {
              'project_label': project.id,
              'ddl': 'pgen-env',
              'dtstart': 'today',
              'dtstop': 'now',
              'columns': ['freezetime', 'irradiance'],
              'project_timezone': that.model.get('timezone')
            },
            {
              'project_label': project.id,
              'ddl': dataSources.energy,
              'dtstart': 'today',
              'dtstop': 'now',
              'columns': ['freezetime', 'ac_power'],
              'project_timezone': that.model.get('timezone')
            }
          ],
          series: [
            Chart.seriesDefaults.irradiance,
            Chart.seriesDefaults.power
          ]
        });

        that.chart_powerHistory.show(chart_powerHistory);

        var chart_healthAndSoiling = new Chart.views.Basic({
          autoUpdate: false,
          type: 'column',
          chartOptions: {
            title: {
              text: 'Energy History'
            }
          },
          traces: [
            {
              'project_label': project.id,
              'ddl':'daily-summary',
              'dtstart': '-30d',
              'dtstop': 'now',
              'columns': ['freezetime', 'insolation'],
              'project_timezone': that.model.get('timezone')
            },
            {
              'project_label': project.id,
              'ddl':'daily-summary',
              'dtstart': '-30d',
              'dtstop': 'now',
              'columns': ['freezetime', 'ac_energy'],
              'project_timezone': that.model.get('timezone')
            }
          ],
          series: [
            Chart.seriesDefaults.insolation,
            Chart.seriesDefaults.energy
          ]
        });

        that.chart_healthAndSoiling.show(chart_healthAndSoiling);
      });
    },
    showIssues: function(){
      // Build issues
      this.issueView = new Issue.views.Table({
        project: this.model,
        collection: this.model.issues
      });

      this.issues.show(this.issueView);
    },
    showKpis: function(){
      // Build kpi view
      this.kpisView = new Project.views.Kpis({model: this.model});

      this.kpis.show(this.kpisView);
    },
    showMap: function(){
      // Instantiate map
      this.mapView = new Project.views.Map({
        itemView: Project.views.MarkerView.extend({
          popUp: Project.views.MarkerPopUpDetail
        }),
        collection: new Project.Collection()
      });

      // Show map
      this.map.show(this.mapView);

      // Update map
      this.mapView.collection.set([this.model]);
      this.mapView.fitToBounds();

      // This is ugly but I'm not sure of a better way to do it with the leaflet API
      _.each(this.mapView.markers._layers, function(marker){
        marker.togglePopup();
      });
    },
    showDevices: function(){
      if (this.model.get('hasDC')){
        this.devicesView = new Device.views.Sitemap({
          model: this.model,
          collection: this.model.devices
        });
      } else {
        // Build devices view
        this.devicesView = new Device.views.Canvas({
          model: this.model,
          collection: this.model.devices,
          rendering: 'POWER'
        });
      }

      // Show devices
      this.devices.show(this.devicesView);
    }
  });
});
