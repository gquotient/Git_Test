define([
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',
  'chart',
  'issue',

  'hbs!layouts/templates/projectDetail'
], function(
  $,
  Backbone,
  Marionette,
  Handlebars,

  Portfolio,
  Project,
  Chart,
  Issue,

  projectDetailTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: projectDetailTemplate
    },

    attributes: {
      id: 'page-projectDetail'
    },

    regions: {
      map: '#map',
      kpis: '#kpis',
      issues: '#issues',
      chart_powerHistory: '#chart_powerHistory',
      chart_healthAndSoiling: '#chart_healthAndSoiling'
    },

    events: {
      'click .edit': function(){
        Backbone.history.navigate('/project/' + this.model.id + '/edit', true);
      }
    },

    onShow: function(){
      this.map.show(this.mapView);

      this.chart_powerHistory.show(this.chartView_powerHistory);

      this.chart_healthAndSoiling.show(this.chartView_healthAndSoiling);

      this.issues.show(this.issueView);
    },

    buildSettings: function(){
      this.settings = $('<ul><li><a href="/ia/project/' + this.model.id + '/edit" class="edit">Edit Project</a></li></ul>');

      var $pageSettings = $('#pageSettings');

      $pageSettings.append(this.settings);
      $pageSettings.addClass('active');
    },

    onClose: function(){
      var $pageSettings = $('#pageSettings');

      $pageSettings.empty();
      $pageSettings.removeClass('active');
    },

    initialize: function(options){
      this.model = options.model;

      this.buildSettings();

      this.mapView = new Project.views.Map({
        collection: new Project.Collection([options.model])
      });
      console.log(this.model.id);
      this.chartView_powerHistory = new Chart.views.Line({
        model: new Chart.models.timeSeries().set({
          'timezone': this.model.get('timezone'),
          'dataType': [
            {
              //This is a hack because the model service and data
              //aren't quite the same
              'project_label': this.model.id,
              'ddl': 'env_300',
              'dtstart': 'today',
              'dtstop': 'now',
              'columns': ['freezetime', 'value_mean'],
              'filters': [
                {'column': 'attribute', 'in_set': ['irradiance']},
                {'column': 'identifier', 'in_set': ['ENV-1']}
              ]
            },
            {
              'project_label': this.model.id,
              'ddl': 'pgen-rm_300',
              'dtstart': 'today',
              'dtstop': 'now',
              'columns': ['freezetime', 'ac_power']
            }
          ]
        }),
        series: [
          Chart.seriesDefaults.irradiance,
          Chart.seriesDefaults.power
        ]
      });

      this.chartView_healthAndSoiling = new Chart.views.Line({
        model: new Chart.models.timeSeries().set({
          'timezone': this.model.get('timezone'),
          'dataType': [
            {
              //This is a hack because the model service and data
              //aren't quite the same
              'project_label': this.model.id,
              'ddl': 'env_300',
              'dtstart': 'today',
              'dtstop': 'now',
              'columns': ['freezetime', 'value_mean'],
              'filters': [
                {'column': 'attribute', 'in_set': ['irradiance']},
                {'column': 'identifier', 'in_set': ['ENV-1']}
              ]
            },
            {
              'project_label': this.model.id,
              'ddl': 'pgen-rm_300',
              'dtstart': 'today',
              'dtstop': 'now',
              'columns': ['freezetime', 'value_mean'],
              'filters': [
                {'column': 'attribute', 'in_set': ['ac_power']}
              ]
            }
          ]
        }),
        series: [
          Chart.seriesDefaults.health,
          Chart.seriesDefaults.soiling
        ]
      });

      this.issueView = new Issue.views.Table({
        collection: new Issue.Collection()
      });

      this.issueView.collection.fetch();

      // Set up listeners
      this.listenTo(Backbone, 'select:portfolio', function(model){
        // Set address bar and force routing
        Backbone.history.navigate('/portfolio/' + model.id, true);
      });

      this.listenTo(Backbone, 'select:project', function(model){
        // Set address bar
        Backbone.history.navigate('/project/' + model.id);
      });
    }
  });
});
