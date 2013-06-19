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
      this.map.show(this.mapView);

      this.contentNavigation.show(this.projectNavigationListView);

      this.buildSettingsDropdown();

      this.selectProject(this.options.model);
    },

    buildSettingsDropdown: function(){
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

    selectProject: function(project) {
      Backbone.trigger('update:breadcrumbs', project);

      // Update map
      this.mapView.collection.set([project]);
      this.mapView.fitToBounds();

      // Build charts
      var chart_powerHistory = new Chart.views.Line({
        model: new Chart.models.timeSeries().set({
          'timezone': this.model.get('timezone'),
          'dataType': [
            {
              'project_label': project.id,
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
              'project_label': project.id,
              'ddl': 'pgen-rm',
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

      var chart_healthAndSoiling = new Chart.views.Line({
        model: new Chart.models.timeSeries().set({
          'timezone': this.model.get('timezone'),
          'dataType': [
            {
              'project_label': project.id,
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
              'project_label': project.id,
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

      this.chart_powerHistory.show(chart_powerHistory);

      this.chart_healthAndSoiling.show(chart_healthAndSoiling);

      // Build issues
      this.issueView = new Issue.views.Table({
        collection: new Issue.Collection()
      });

      this.issues.show(this.issueView);

      this.issueView.collection.fetch();

      // Reset active indicator
      $('.nav_content').find('.active').removeClass('active');

      // Find current model view and set active
      this.projectNavigationListView.children.each(function(view){
        if (view.model.id === project.id) {
          view.$el.addClass('active');
          return;
        }
      });
    },

    onClose: function(){
      // Clean up contextual settings
      this.options.settingsRegion.close();
    },

    initialize: function(options){
      // Instantiate map
      this.mapView = new Project.views.Map({
        collection: new Project.Collection()
      });

      // Instantiate left nav
      this.projectNavigationListView = new Project.views.NavigationListView({
        collection: options.collection
      });

      this.listenTo(Backbone, 'click:project', function(project){
        this.selectProject(project);
        Backbone.history.navigate('/project/' + project.id);
      });
    }
  });
});
