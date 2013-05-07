define(
  [
    'jquery',
    'underscore',
    'backbone',
    'backbone.marionette',

    'form'
  ],
  function(
    $,
    _,
    Backbone,
    Marionette,

    Forms
  ){

    var Team = { models: {}, collections: {}, views: {} };

    Team.models.Team = Backbone.Model.extend({
      idAttribute: 'team_id',
      url: '/api/teams'
    }, {
      schema: {
        attributes: {
          'name': {
            type: 'text',
            title: 'Name'
          },
          'label': {
            type: 'text',
            title: 'Team Label'
          }
        }
      }
    });

    Team.collections.Teams = Backbone.Collection.extend({
      model: Team.models.Team,
      url: '/api/teams'
    });

    // Table CompositeView extended from form
    Team.views.EditTable = Forms.views.table.extend({
      fields: ['name', 'label'],
      model: Team.models.Team,
      actions: ['edit', 'cancel', 'save']
    });

    return Team;
  }
);
