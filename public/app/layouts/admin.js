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
      'teams': {
        collection: Team.collections.Teams,
        view: Team.views.EditTable,
        title: 'Teams',
        detail: function(options){
          var layout = new TeamManagementLayout({ team: options.model });
          return layout;
        }
      },
      'all_users': {
        collection: User.AllUsers,
        view: User.views.VendorEditTable,
        title: 'All Users'
      },
      'all_teams': {
        collection: Team.collections.AllTeams,
        view: Team.views.EditAllTable,
        title: 'All Teams',
        detail: function(options){
          var layout = new TeamManagementLayout({ team: options.model });
          return layout;
        }
      },
      'organizations': {
        collection: Organization.collections.Organizations,
        view: Organization.views.EditTable,
        title: 'All Organizations'
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
      pageContent: '.pageContent',
      pageNav: '.column_left'
    },

    getView: function(page){
      var
        viewConfig = config.views[page],
        collection = new viewConfig.collection(),
        view = new viewConfig.view({collection: collection})
      ;

      collection.fetch();

      return view;
    },

    renderView: function(view){
      var myView = this.getView(view);

      // Set active nav element
      this.$el.find('.nav_content li').removeClass('active');
      this.$el.find('.nav_content li.' + view).addClass('active');

      // Display view
      this.pageContent.show(myView);

      // Update history
      Backbone.history.navigate('/admin/' + view);
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
      }
    },

    initialize: function(options){
      Backbone.trigger('reset:breadcrumbs', {state:'admin', display_name: 'Admin'})
      this.detail = this.options.detail;

      this.initialView = options.initialView || 'users';

      this.view = this.initialView;

      this.listenTo(Backbone, 'detail', function(model){
        this.renderDetailView({ model: model, page: this.view });
        Backbone.history.navigate('/admin/'+ this.view + '/' + model.id);
      }, this);
    }
  });

});
