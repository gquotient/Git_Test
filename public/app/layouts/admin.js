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
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: adminTemplate
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

    subViews: {
      users: {
        title: 'Edit Users'
      },
      teams: {
        title: 'Edit Teams'
      },
      organizations: {
        title: 'Edit Organizations'
      }
    },

    renderView: function(view){
      var myView = this.subViews[view];

      // Set active nav element
      this.$el.find('.nav_content li').removeClass('active');
      this.$el.find('.nav_content li.' + view).addClass('active');

      // Update page title
      this.$el.find('.pageTitle').text(myView.title);

      // Fetch latest data
      myView.view.collection.fetch();

      // Display view
      this.pageContent.show(myView.view);

      // Fetch latest
      // NOTE: this is mostly a hack to avoid the itemViewError in Marionette
      myView.view.collection.fetch();
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

      // Buid users edit view
      var users = new User.Collection();
      //users.fetch();

      this.subViews.users.view = new User.views.editTable({ collection: users });

      // Buid teams edit view
      var teams = new Team.collections.Teams();
      //teams.fetch();

      this.subViews.teams.view = new Team.views.editTable({ collection: teams });

      // Buid organizations edit view
      var organizations = new Organization.collections.Organizations();
      //organizations.fetch();

      this.subViews.organizations.view = new Organization.views.editTable({ collection: organizations });
    }
  });
});
