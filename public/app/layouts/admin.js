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

      console.log(view, myView);

      // Set active nav element
      this.$el.find('.nav_content li').removeClass('active');
      this.$el.find('.nav_content li.nav-' + view).addClass('active');

      this.$el.find('.pageTitle').text(myView.title);
      this.pageContent.show(myView.view);
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
      if (options.initialView) {
        this.initialView = options.initialView;
      }

      var users = new User.Collection();
      users.fetch();

      this.subViews.users.view = new User.views.editTable({ collection: users });

      var teams = new Team.collections.Teams();
      teams.fetch();

      this.subViews.teams.view = new Team.views.editTable({ collection: teams });

      var organizations = new Organization.collections.Organizations();
      organizations.fetch();

      this.subViews.organizations.view = new Organization.views.editTable({ collection: organizations });
    }
  });
});
