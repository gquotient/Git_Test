define([
  'backbone',
  'backbone.marionette',
  'handlebars',

  'team',
  'user',
  'project',

  'hbs!layouts/admin/templates/teamManagement'
], function(
  Backbone,
  Marionette,
  Handlebars,

  Team,
  User,
  Project,

  teamManagementTemplate
){

  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: teamManagementTemplate
    },
    regions: {
      currentMembersRegion: '#currentMembers',
      allUsersRegion: '#allUsers',
      currentProjectsRegion: '#currentProjects',
      allProjectsRegion: '#allProjects'
    },
    onShow: function(){
      this.currentMembersRegion.show(this.currentMembersView);
      this.allUsersRegion.show( this.allUsersView );
      this.currentProjectsRegion.show(this.currentProjectsView);
      this.allProjectsRegion.show( this.allProjectsView );

    },
    initialize: function(options){
      Backbone.trigger('set:breadcrumbs', {
        state: 'team',
        display_name: options.team.get('team_label'),
        url: '/admin/teams/' + options.team.get('team_id')
      });

      this.model = this.team = this.options.team;
      this.allUsers = new User.OrganizationUsers({ org_label: this.team.get('org_label') });
      this.allProjects =  new Project.Collection([], { url: '/api/orgprojects/' });

      this.currentMembersView = new Team.views.TeamUserDetail({ model: this.team, collection: this.team.users });
      this.allUsersView = new User.views.listView({ collection: this.allUsers });

      this.currentProjectsView = new Team.views.TeamProjectDetail({ model: this.team, collection: this.team.projects });
      this.allProjectsView = new Project.views.List({ collection: this.allProjects });

      this.listenTo(this.currentMembersView, 'itemview:select:user', function(triggerArgs){
        this.team.removeUser(triggerArgs.model);
      });

      this.listenTo(this.allUsersView, 'itemview:select:user', function(triggerArgs){
        this.team.addUser(triggerArgs.model);
      });

      this.listenTo(this.currentProjectsView, 'itemview:select:project', function(triggerArgs){
        if(this.team.get('team_label') !== 'ADMIN'){
          this.team.removeProject(triggerArgs.model);
        }
      });

      this.listenTo(this.allProjectsView, 'itemview:select:project', function(triggerArgs){
        if(this.team.get('team_label') !== 'ADMIN'){
          this.team.addProject(triggerArgs.model);
        }
      });

      this.allUsers.fetch();
      this.allProjects.fetch();
      this.team.getUsers();
      this.team.getProjects();
      Backbone.history.navigate('/admin/teams/' + this.team.id);

    }
  });

});
