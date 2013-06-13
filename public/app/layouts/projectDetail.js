define([
  'jquery',
  'underscore',
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
  _,
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
      map: '.map',
      kpis: '.kpis',
      contentNavigation: '.nav_content',
      issues: '.issues',
      chart_powerHistory: '.chart#powerHistory',
      chart_healthAndSoiling: '.chart#healthAndSoiling'
    },

    events: {
      'click .edit': function(){
        Backbone.history.navigate('/project/' + this.model.id + '/edit', true);
      }
    },

    onShow: function(){
      console.log(this.map);
      this.map.show(this.mapView);

      this.contentNavigation.show(this.projectNavigationListView);

      this.chart_powerHistory.show(this.chartView_powerHistory);

      this.chart_healthAndSoiling.show(this.chartView_healthAndSoiling);

      this.issues.show(this.issueView);

      this.buildSettings();
    },

    buildSettings: function(){
      var that = this;

      //Create settings view
      this.settings = new Marionette.ItemView({
        tagName: 'ul',
        template: _.template('<li><a href="#" class="edit">Edit Project</a></li>')
      });

      //Show ItemView in cached region
      this.options.settingsRegion.show(this.settings);

      //Define listeners
      this.options.settingsRegion.$el.find('.edit').on('click', function(event){
        event.preventDefault();

        //Navigate to edit view
        Backbone.history.navigate('/project/' + that.model.id + '/edit', true);
      });
    },

    onClose: function(){
      // Clean up contextual settings
      this.options.settingsRegion.close();
    },

    initialize: function(options){
      this.model = options.model;

      console.log(this.model);

      this.mapView = new Project.views.Map({
        collection: new Project.Collection([options.model])
      });

      this.chartView_powerHistory = new Chart.views.Line({
        model: new Chart.models.timeSeries().set({
          'timezone': this.model.get('timezone'),
          'dataType': [
            {
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

      // console.log(options);

      this.projectNavigationListView = new Project.views.NavigationListView({
        collection: options.collection
      });

      this.chartView_healthAndSoiling = new Chart.views.Line({
        model: new Chart.models.timeSeries().set({
          'timezone': this.model.get('timezone'),
          'dataType': [
            {
              'project_label': this.model.id,
              'ddl': 'env_300',
              'dtstart': 'today',
              'dtstop': 'now',
              'columns': ['freezetime', 'value_mean'],
              'filters': [
                {'column': 'attribute', 'in_set': ['irradiance']},
                {'column': 'identifier', 'in_set': ['IRR-1']}
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

      this.listenTo(Backbone, 'click:project', function(model){
        this.mapView.collection.set(model);
        this.mapView.fitToBounds();
        Backbone.trigger('update:breadcrumbs', model);
        Backbone.history.navigate('/project/' + model.id);
      });

    }
  });
});
