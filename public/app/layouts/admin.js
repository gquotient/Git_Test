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

  'layouts/admin/users',
  'layouts/admin/teams',
  'layouts/admin/projects',
  'layouts/admin/portfolios',

  'hbs!layouts/templates/admin'
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
  PortfoliosLayout,

  adminTemplate
){

  var config = {
    views: {
      'users': {
        title: 'Users',
        trigger: 'select:users'
      },
      'teams': {
        title: 'Teams',
        trigger: 'select:teams'
      },
      'projects': {
        title: 'Projects',
        trigger: 'select:projects'
      },
      'portfolios': {
        title: 'Portfolios',
        trigger: 'select:portfolios'
      },
      'organizations': {
        title: 'All Organizations',
        trigger: 'select:allOrganizations'
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

    showProject: function(id){
      var layout = new ProjectsLayout({
        collection: ia.alignedProjects,
        user: ia.currentUser,
        current: id
      });

      this.pageContent.show(layout);
      this.highlightLink('projects');

      return layout;
    },

    showPortfolios: function(id){
      // Force id to be a number
      id = +id;

      var layout = new PortfoliosLayout({
        collection: ia.portfolios
      });

      this.pageContent.show(layout);
      this.highlightLink('portfolios');

      if (id && id !== 'new') {
        var portfolio = ia.portfolios.findWhere({portfolio_id: id});
        layout.edit(portfolio);
      } else if (id && id === 'new') {
        layout.edit();
      }

      return layout;
    },

    showAlarms: function(){

    },

    events: {
      'click .nav_content li': function(event){
        // Get current target so it works on bubbled up event
        var route = event.currentTarget.id;

        Backbone.trigger('select:' + route);
      }
    },

    initialize: function(options){
      Backbone.trigger('reset:breadcrumbs', {
        state:'admin',
        display_name: 'Admin'
      });

      this.listenTo(Backbone, 'select:admin', function(){
        this.showUsers();
      });

      this.listenTo(Backbone, 'select:users', function(){
        this.showUsers();
      });

      this.listenTo(Backbone, 'select:teams', function(){
        this.showTeams();
      });

      this.listenTo(Backbone, 'select:projects', function(){
        this.showProject();
      });

      this.listenTo(Backbone, 'select:portfolios', function(){
        this.showPortfolios();
      });

    }
  });

});
