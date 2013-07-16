define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',

  'user',
  'team',
  'organization',

  'layouts/adminLayouts/users',
  'layouts/adminLayouts/teams',
  'layouts/adminLayouts/projects',
  'layouts/adminLayouts/alarmManagement',

  'hbs!layouts/adminLayouts/templates/admin'
], function(
  _,
  $,
  Backbone,
  Marionette,
  Handlebars,

  ia,

  User,
  Team,
  Organization,

  UsersLayout,
  TeamsLayout,
  ProjectsLayout,
  AlarmManagementTemplate,

  adminTemplate
){

  var config = {
    views: {
      'users': {
        title: 'Users',
        trigger: 'show:users'
      },
      'teams': {
        title: 'Teams',
        trigger: 'show:teams'
      },
      'projects': {
        title: 'Projects',
        trigger: 'show:projects'
      },
      'all_users': {
        title: 'All Users',
        trigger: 'show:allUsers'
      },
      'all_teams': {
        title: 'All Teams',
        trigger: 'show:allTeams'
      },
      'organizations': {
        title: 'All Organizations',
        trigger: 'show:allOrganizations'
      },
      'alarms': {

      }
    }
  };

  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: adminTemplate
    },
    templateHelpers: function(){
      var viewList = this.options.currentUser.get('role').admin.views;
      var views = _.pick(config.views, viewList);
      return {
        views: views
      };
    },
    attributes: {
      id: 'page-admin'
    },
    regions: {
      pageContent: '.column_right',
      pageNav: '.column_left'
    },

    highlightLink: function(view){
      // Set active nav element
      this.$el.find('.nav_content li').removeClass('active');
      this.$el.find('.nav_content li.' + view).addClass('active');
    },

    showUsers: function(){
      var userAdminLayout = new UsersLayout();
      this.pageContent.show(userAdminLayout);

      this.highlightLink('users');

      return userAdminLayout;
    },

    showTeams: function(){
      var teamAdminLayout = new TeamsLayout();
      this.pageContent.show(teamAdminLayout);

      this.highlightLink('teams');

      return teamAdminLayout;
    },

    showProjects: function(){
      var layout = new ProjectsLayout({
        collection: ia.alignedProjects
      });

      this.pageContent.show(layout);
      this.highlightLink('projects');

      return layout;
    },

    showAlarms: function(){

    },

    events: {
      'click .nav_content a': function(event){
        event.preventDefault();

        // This seems kind of hacky, but (shrug)
        var route = event.target.hash.replace('#', '');

        Backbone.trigger(config.views[route].trigger);
      }
    },

    initialize: function(options){

      Backbone.trigger('reset:breadcrumbs', {
        state:'admin',
        display_name: 'Admin'
      });

      // this.listenTo(Backbone, 'detail', function(model){
      //   this.renderDetailView({ model: model, page: this.view });
      //   Backbone.history.navigate('/admin/'+ this.view + '/' + model.id);
      // }, this);

      this.listenTo(Backbone, 'show:users', this.showUsers);
      this.listenTo(Backbone, 'show:teams', this.showTeams);
      this.listenTo(Backbone, 'show:projects', this.showProjects);

    }
  });

});
