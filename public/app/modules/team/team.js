define(
  [
    'jquery',
    'underscore',
    'backbone',
    'backbone.marionette',

    'user',

    'form',

    'hbs!team/templates/team_detail'
  ],
  function(
    $,
    _,
    Backbone,
    Marionette,

    User,

    Forms,

    teamDetailTemplate
  ){

    var Team = { models: {}, collections: {}, views: {} };

    Team.models.Team = Backbone.Model.extend({
      idAttribute: 'team_id',
      url: '/api/teams',
      getUsers: function(){
        this.users = new User.TeamUsers({team: this});
        this.users.fetch();
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

    Team.views.TeamDetail = Marionette.CompositeView.extend({
      model: Team.models.Team,
      template: {
        template: teamDetailTemplate,
        type: 'handlebars'
      },
      itemViewContainer: '#users',
      itemView: User.views.itemView
    });

    // Table CompositeView extended from form
    Team.views.EditTable = Forms.views.table.extend({
      fields: ['name', 'team_label', 'org_label'],
      model: Team.models.Team,
      actions: ['edit', 'cancel', 'save', 'detail']
    });

    return Team;
  }
);
