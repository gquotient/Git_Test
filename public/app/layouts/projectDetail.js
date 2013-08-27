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

  'hbs!layouts/templates/projectDetail'
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

  projectDetailTemplate
){

  var DevicesView = Marionette.CollectionView.extend({
    itemView: Device.views.Canvas,

    itemViewOptions: function(project){
      return {
        collection: project.devices,
        rendering: 'POWER',
        editable: false
      };
    },

    initialize: function(){
      this.collection = new Backbone.Collection();
    },

    showProject: function(project){
      var view = this.children.findByModel(project);

      if (this.currentView) {
        if (this.currentView === view) { return; }

        this.currentView.undelegateCanvasEvents();
        this.currentView.$el.hide();
        this.currentView = null;
      }

      if (view) {
        view.delegateCanvasEvents();
        view.$el.show();
        this.currentView = view;

      } else {
        this.collection.add(project);

        if (!project.devices.length) {
          project.fetch({equipment: this.options.equipment});
        }
      }
    },

    onAfterItemAdded: function(view){
      this.currentView = view;
    }
  });


  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: projectDetailTemplate
    },
    attributes: {
      id: 'page-projectDetail'
    },
    regions: {
      map: '.map',
      devices: '.devices',
      kpis: '.kpis',
      contentNavigation: '.nav_content',
      issues: '.issues',
      chart_powerHistory: '.chart#powerHistory',
      chart_healthAndSoiling: '.chart#healthAndSoiling'
    },
    events: {
      'click .edit': function(){
        Backbone.history.navigate('/admin/projects/' + this.model.id, true);
      },
      'click .toggleView': 'toggleView'
    },
    currentView: 'map',
    toggleView: function(){
      if (this.currentView === 'map') {
        this.currentView = 'devices';
        $('.map').hide();
        $('.devices').show();
      } else {
        this.currentView = 'map';
        $('.devices').hide();
        $('.map').show();
      }
    },
    onShow: function(){
      $('.devices').hide();

      this.map.show(this.mapView);

      this.devices.show(this.devicesView);

      this.contentNavigation.show(this.projectNavigationListView);

      //this.buildSettingsDropdown();

      this.selectProject(this.options.model);
    },
    buildSettingsDropdown: function(){
      var that = this;

      //Create settings view
      var settingsDropdown = new Marionette.ItemView({
        tagName: 'li',
        className: 'menu dropdown',
        template: _.template('<ul><li><a href="#" class="edit">Edit Project</a></li></ul>'),
        events: {
          'click .edit': function(event){
            event.preventDefault();
            Backbone.history.navigate('/project/' + that.model.id + '/edit', true);
          }
        }
      });

      //Show ItemView in cached region
      this.options.settingsRegion.show(settingsDropdown);
    },

    selectProject: function(project) {
      var that = this;

      this.model = project;

      Backbone.trigger('set:breadcrumbs', {model: project, state: 'project', display_name: project.get('display_name')});

      // Update map
      this.mapView.collection.set([project]);
      this.mapView.fitToBounds();

      // This is ugly but I'm not sure of a better way to do it with the leaflet API
      _.each(this.mapView.markers._layers, function(marker){
        marker.togglePopup();
      });

      // Add project to devices view and activate it.
      this.devicesView.showProject(project);

      this.model.findDataSources().done(function(dataSources){
        // Build charts
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

      // Build issues
      var issueView = new Issue.views.Table({
        project: this.model,
        collection: this.model.issues
      });

      this.issues.show(issueView);

      // Build kpi view
      var kpisView = new Project.views.Kpis({model: this.model});

      this.kpis.show(kpisView);

      // Update active item
      this.projectNavigationListView.setActive(this.model.id);
    },

    onClose: function(){
      // Clean up contextual settings
      this.options.settingsRegion.close();

      // Clear data fetch
      clearInterval(this.fetchInterval);
    },

    initialize: function(options){
      // Instantiate map
      this.mapView = new Project.views.Map({
        itemView: Project.views.MarkerView.extend({
          popUp: Project.views.MarkerPopUpDetail
        }),
        collection: new Project.Collection()
      });

      // Instantiate devices collection view.
      this.devicesView = new DevicesView({
        equipment: options.equipment
      });

      // Instantiate left nav
      this.projectNavigationListView = new Project.views.NavigationListView({
        collection: options.collection
      });

      // Fetch data for all projects
      var fetchData = function(){
        options.collection.fetchIssues();
      };

      // Fetch data right away
      fetchData();

      // Fetch data every 15 minutes
      this.fetchInterval = setInterval(900000, fetchData);

      this.listenTo(Backbone, 'click:project', function(project){
        this.selectProject(project);
        Backbone.history.navigate('/project/' + project.id);
      });

      this.listenTo(Backbone, 'click:issue', function(issue){
        var issueId = (issue === 'all') ? '' : '/' + issue.id;

        Backbone.history.navigate('/project/' + this.model.id + '/issues' + issueId, true);
      });

      this.listenTo(Backbone, 'click:device', function(device){
        Backbone.history.navigate('/project/' + this.model.id + '/devices/' + device.get('graph_key'), true);
      });
    }
  });
});
