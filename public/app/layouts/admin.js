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

  'layouts/teamManagement',

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

  TeamManagementLayout,

  adminTemplate
){

  var config = {
    views: {
      'users': {
        collection: User.Collection,
        view: User.views.EditTable,
        title: 'Users'
      },
      'organizations': {
        collection: Organization.collections.Organizations,
        view: Organization.views.EditTable,
        title: 'Organizations'
      },
      'teams': {
        collection: Team.collections.Teams,
        view: Team.views.EditTable,
        title: 'Teams',
        detail: function(options){
          // Get the team's members.
          // options.model.getUsers();

          // Get a list of all users for that organization.
          // var allUsers = new User.OrganizationUsers({ org_label: options.model.get('org_label') });
          // allUsers.fetch();

          // var view = new Team.views.TeamDetail({ model: options.model, collection: options.model.users });

          var layout = new TeamManagementLayout({ team: options.model })

          return layout;
        }
      },
      'vendor_users': {
        collection: User.Collection,
        view: User.views.VendorEditTable,
        title: 'Vendor Users'
      }
    }
  };

  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: adminTemplate
    },
    templateHelpers: function(){
      var viewList = this.app.currentUser.get('role').admin.views;
      var views = _.pick(config.views, viewList);
      return {
        views: views
      };
    },
    attributes: {
      id: 'page-admin'
    },
    regions: {
      pageContent: '.pageContent',
      pageNav: '.column_left'
    },

    initialView: 'users',

    getView: function(page){
      var
        viewConfig = config.views[page],
        collection = new viewConfig.collection(),
        view = new viewConfig.view({collection: collection})
      ;

      collection.fetch();

      this.$el.find('.pageTitle').text('Edit ' + viewConfig.title);

      return view;
    },

    renderView: function(view){
      var myView = this.getView(view);

      // Set active nav element
      this.$el.find('.nav_content li').removeClass('active');
      this.$el.find('.nav_content li.' + view).addClass('active');

      // Display view
      this.pageContent.show(myView);
    },

    renderDetailView: function(options){
      var viewConfig = config.views[options.page];
      this.pageContent.show( viewConfig.detail(options) );
    },

    onShow: function(){
      this.renderView(this.initialView, this.page_id);
    },

    events: {
      'click .nav_content a': function(event){
        event.preventDefault();

        // This seems kind of hacky, but (shrug)
        var route = event.target.hash.replace('#', '');

        // Build view
        this.renderView(route);

        // Keep track of current view.
        this.view = route;

        // Update history
        Backbone.history.navigate('/admin/' + route);
      }
    },

    initialize: function(options){
      this.app = this.options.app;
      this.detail = this.options.detail;
      // Update initial view if available
      // NOTE: there's probably a sexier way to do this
      if (options.initialView) {
        this.initialView = options.initialView;
      }

      this.view = this.initialView;

      this.listenTo(Backbone, 'detail', function(model){
        this.renderDetailView({ model: model, page: this.view });
        Backbone.history.navigate('/admin/'+ this.view + '/' + model.id);
      }, this);
    }
  });

});
