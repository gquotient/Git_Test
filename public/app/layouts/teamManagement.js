define([
  'backbone',
  'backbone.marionette',
  'handlebars',

  'team',
  'user',

  'hbs!layouts/templates/teamManagement'
], function(
  Backbone,
  Marionette,
  Handlebars,

  Team,
  User,

  teamManagementTemplate
){

  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: teamManagementTemplate
    },
    regions: {
      currentMembersRegion: '#currentMembers',
      allUsersRegion: '#allUsers'
    },
    onShow: function(){
      this.currentMembersRegion.show(this.currentMembersView);
      this.allUsersRegion.show( this.allUsersView );
    },
    initialize: function(){
      this.team = this.options.team;
      this.allUsers = new User.OrganizationUsers({ org_label: this.team.get('org_label') });

      this.currentMembersView = new Team.views.TeamDetail({ model: this.team, collection: this.team.users });
      this.allUsersView = new User.views.listView({ collection: this.allUsers });

      this.listenTo(this.currentMembersView, 'itemview:select:user', function(triggerArgs){
        this.team.removeUser(triggerArgs.model);
      });

      this.listenTo(this.allUsersView, 'itemview:select:user', function(triggerArgs){
        this.team.addUser(triggerArgs.model);
      });

      this.allUsers.fetch();
      this.team.getUsers();
    }
  });

});
