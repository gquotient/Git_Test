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

    // Sub Views
    users: function(){
      var collection = new User.Collection(),
          view = new User.views.editTable({ collection: collection });

      // Fetch latest
      collection.fetch();

      // Update page title
      this.$el.find('.pageTitle').text('Edit Users');

      return view;
    },
    teams: function(){
      // Buid teams edit view
      var collection = new Team.collections.Teams(),
          view = new Team.views.editTable({ collection: collection });

      // Fetch latest
      collection.fetch();

      // Update page title
      this.$el.find('.pageTitle').text('Edit Teams');

      return view;
    },
    organizations: function(){
      // Buid organizations edit view
      var collection = new Organization.collections.Organizations(),
          view = new Organization.views.editTable({ collection: collection });

      collection.fetch();

      // Update page title
      this.$el.find('.pageTitle').text('Edit Organizations');

      return view;
    },

    renderView: function(view){
      var myView = this[view]();

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
