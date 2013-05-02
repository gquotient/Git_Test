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
      idAttribute: 'label'
    }, {
      schema: {
        attributes: {
          'name': {
            type: 'text',
            title: 'Name'
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
      fields: ['name'],
      model: Team.models.Team,
      actions: true
    });

    return Team;
  }
);
