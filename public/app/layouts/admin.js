define([
  'backbone',
  'backbone.marionette',
  'handlebars',

  'user',
  'team',

  'hbs!layouts/templates/admin'
], function(
  Backbone,
  Marionette,
  Handlebars,

  User,
  Team,

  adminTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: adminTemplate
    },
    attributes: {
      class: 'basicView'
    },
    regions: {
      editUsers: '#editUsers',
      editTeams: '#editTeams',
      editOrganizations: '#editOrganizations'
    },

    onShow: function(){
      var users = new User.Collection();
      users.fetch();

      this.editUsers.show( new User.views.editTable({ collection: users }) );

      var teams = new Team.collections.Teams();
      teams.fetch();

      this.editTeams.show( new Team.views.editTable({ collection: teams }) );
    },

    initialize: function(){

    }
  });
});
