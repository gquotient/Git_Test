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
  'layouts/admin/portfolios',
  'layouts/admin/projects',
  'layouts/admin/equipment',
  'layouts/admin/alarms',

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
  PortfoliosLayout,
  ProjectsLayout,
  EquipmentLayout,
  AlarmsLayout,

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
      'organizations': {
        title: 'All Organizations',
        trigger: 'select:allOrganizations'
      },
      'portfolios': {
        title: 'Portfolios',
        trigger: 'select:portfolios'
      },
      'projects': {
        title: 'Projects',
        trigger: 'select:projects'
      },
      'equipment': {
        title: 'Equipment',
        trigger: 'select:equipment'
      },
      'alarms': {
        title: 'Alarms',
        trigger: 'select:alarms'
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

    showProjects: function(id){
      var layout = new ProjectsLayout({
        collection: ia.alignedProjects,
        user: ia.currentUser,
        current: id
      });

      this.pageContent.show(layout);
      this.highlightLink('projects');

      return layout;
    },

    showEquipment: function(id){
      var layout = new EquipmentLayout({
        collection: ia.equipment,
        user: ia.currentUser,
        current: id
      });

      this.pageContent.show(layout);
      this.highlightLink('equipment');

      return layout;
    },

    showAlarms: function(){
      var layout = new AlarmsLayout({
        projects: ia.projects
      });

      this.pageContent.show(layout);
      this.highlightLink('alarms');

      return layout;
    },

    showRoute: function(route, id){
      var routeCapital = route.charAt(0).toUpperCase() + route.slice(1);

      Backbone.trigger('reset:breadcrumbs', {
        state:'admin',
        display_name: 'Admin'
      });

      Backbone.trigger('set:breadcrumbs', {state: route, display_name: routeCapital});

      // Update history
      Backbone.history.navigate('/admin/' + route);

      this['show' + routeCapital](id);
    },

    events: {
      'click .nav_content li': function(event){
        // Get current target so it works on bubbled up event
        var route = event.currentTarget.id;

        Backbone.trigger('select:' + route, {route: route});
      }
    },

    initialize: function(options){
      Backbone.trigger('reset:breadcrumbs', {
        state:'admin',
        display_name: 'Admin'
      });

      // NOTE - This may not be the best way to handle admin routes but,
      // it's less ugly than before
      this.listenTo(Backbone, 'select', function(data){
        this.showRoute(data.route);
      });
    }
  });
});
