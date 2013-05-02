define([
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'user',
  'team',
  'organization',

  'hbs!layouts/templates/admin'
], function(
  $,
  Backbone,
  Marionette,
  Handlebars,

  User,
  Team,
  Organization,

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
        title: 'Teams'
      }
    }
  };

  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: adminTemplate
    },
    templateHelpers: {
      views: config.views
    },
    attributes: {
      id: 'page-admin'
    },
    regions: {
      pageContent: '.pageContent',
      pageNav: '.column_left'
      //editUsers: '#editUsers',
      //editTeams: '#editTeams',
      //editOrganizations: '#editOrganizations'
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

    onShow: function(){
      this.renderView(this.initialView);
    },

    events: {
      'click .nav_content a': function(event){
        event.preventDefault();

        // This seems kind of hacky, but (shrug)
        var route = event.target.hash.replace('#', '');

        // Build view
        this.renderView(route);

        // Update history
        Backbone.history.navigate('/admin/' + route);
      }
    },

    initialize: function(options){
      // Update initial view if available
      // NOTE: there's probably a sexier way to do this
      if (options.initialView) {
        this.initialView = options.initialView;
      }

      /*
      This works as long as you hit the root first, but doesn't
      work properly if you hit root/subView and I don't feel like
      figuring it out tonight

      this.Router = new Backbone.Marionette.AppRouter.extend({
        controller: this,
        appRoutes: {
          'admin/:page': 'renderView'
        }
      });
      */
    }
  });
});
