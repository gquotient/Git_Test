define(
  [
    'jquery',
    'underscore',
    'backbone',
    'backbone.marionette',

    'user',
    'project',

    'form',

    'hbs!team/templates/team_user_detail',
    'hbs!team/templates/team_project_detail'

  ],
  function(
    $,
    _,
    Backbone,
    Marionette,

    User,
    Project,

    Forms,

    teamUserDetailTemplate,
    teamProjectDetailTemplate
  ){

    var Team = { models: {}, collections: {}, views: {} };

    Team.models.Team = Backbone.Model.extend({
      idAttribute: 'team_id',
      url: '/api/teams',
      getUsers: function(){
        this.users.fetch();
      },
      getProjects: function(){
        this.projects.fetch();
      },
      addUser: function(user){
        if(!this.users.contains(user)){

          this.users.add(user);

          $.ajax('/api/user_team', {
            type: 'PUT',
            data: {
              email: user.get('email'),
              org_label: this.get('org_label'),
              team_label: this.get('team_label')
            }
          });
        }
      },
      removeUser: function(user){
        this.users.remove(user);
        $.ajax('/api/user_team', {
          type: 'DELETE',
          data: {
            email: user.get('email'),
            org_label: this.get('org_label'),
            team_label: this.get('team_label')
          }
        });
      },
      addProject: function(project){
        if(!this.projects.contains(project)){

          this.projects.add(project);

          $.ajax('/api/teamprojects', {
            type: 'POST',
            data: {
              projects: project.get('project_label'),
              org_label: this.get('org_label'),
              team_label: this.get('team_label')
            }
          });
        }
      },
      removeProject: function(project){
        this.projects.remove(project);
        $.ajax('/api/teamprojects', {
          type: 'DELETE',
          data: {
            project_label: project.get('project_label'),
            org_label: this.get('org_label'),
            team_label: this.get('team_label')
          }
        });
      },
      initialize: function(){
        this.users = new User.TeamUsers({team: this});
        this.projects = new Project.TeamProjects({team: this});
      }
    }, {
      schema: {
        attributes: {
          'name': {
            type: 'text',
            title: 'Name'
          },
          'team_label': {
            type: 'text',
            title: 'Team Label'
          },
          'org_label': {
            type: 'text',
            title: 'Org Label'
          }
        }
      }
    });

    Team.collections.Teams = Backbone.Collection.extend({
      model: Team.models.Team,
      url: '/api/teams'
    });

    Team.collections.AllTeams = Team.collections.Teams.extend({
      url: '/api/teams?org_label=ALL'
    });

    Team.views.TeamUserDetail = Marionette.CompositeView.extend({
      model: Team.models.Team,
      template: {
        template: teamUserDetailTemplate,
        type: 'handlebars'
      },
      itemViewContainer: '#users',
      itemView: User.views.itemView
    });

    Team.views.TeamProjectDetail = Marionette.CompositeView.extend({
      model: Team.models.Team,
      template: {
        template: teamProjectDetailTemplate,
        type: 'handlebars'
      },
      itemViewContainer: '#projects',
      itemView: Project.views.Item
    });

    // Table CompositeView extended from form
    Team.views.EditTable = Forms.views.table.extend({
      fields: ['name', 'team_label'],
      model: Team.models.Team,
      actions: ['edit', 'cancel', 'save', 'detail']
    });

    // Table CompositeView extended from form
    Team.views.EditAllTable = Forms.views.table.extend({
      fields: ['name', 'team_label', 'org_label'],
      model: Team.models.Team,
      actions: ['edit', 'cancel', 'save', 'detail']
    });

    return Team;
  }
);
