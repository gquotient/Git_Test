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
      'all_users': {
        collection: User.AllUsers,
        view: User.views.VendorEditTable,
        title: 'All Users'
      },
      'all_teams': {
        collection: Team.collections.AllTeams,
        view: Team.views.EditAllTable,
        title: 'All Teams'
      },
      'organizations': {
        collection: Organization.collections.Organizations,
        view: Organization.views.EditTable,
        title: 'All Organizations'
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

    renderView: function(view){
      // Set active nav element
      this.$el.find('.nav_content li').removeClass('active');
      this.$el.find('.nav_content li.' + view).addClass('active');

      // Display view
    },

    // onShow: function(){
    //   this.renderView(this.initialView, this.page_id);
    // },

    showUsers: function(){
      var userAdminLayout = new UsersLayout();
      this.pageContent.show(userAdminLayout);
      return userAdminLayout;
    },

    showTeams: function(){
      var teamAdminLayout = new TeamsLayout();
      this.pageContent.show(teamAdminLayout);
      return teamAdminLayout;
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

    }
  });

});
