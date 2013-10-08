define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',

  'layouts/projects/detail',

  'hbs!layouts/templates/projects'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  Portfolio,
  Project,

  DetailLayout,

  projectsTemplate
){

  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: projectsTemplate
    },
    attributes: {
      id: 'page-projectDetail'
    },
    regions: {
      pageContent: '.pageContent',
      contentNavigation: '.nav_content'
    },
    events: {
      'click .edit': function(){
        Backbone.history.navigate('/admin/projects/' + this.model.id, true);
      }
    },
    onShow: function(){
      var that = this;
      // Fetch data for all projects
      var fetchProjectData = function(){
        return {
          issues: that.collection.fetchIssues()
        };
      };

      // Run initially to get latest data
      fetchProjectData().issues.done(function(data){
        Backbone.trigger('notification', data.alarms);
      });

      // Fetch issues every five minutes
      this.fetchDataInterval = setInterval(fetchProjectData, 300000);

      this.contentNavigation.show(this.projectNavigationListView);

      this.selectProject(this.model);
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
      this.model = project;

      Backbone.trigger('set:breadcrumbs', {model: project, state: 'project', display_name: project.get('display_name')});

      var detailLayout = new DetailLayout({
        model: project,
        equipment: this.options.equipment
      });

      this.pageContent.show(detailLayout);

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
