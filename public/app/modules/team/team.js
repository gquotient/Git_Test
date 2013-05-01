define(
  [
    'jquery',
    'underscore',
    'backbone',
    'backbone.marionette',

    'form',

    'hbs!team/templates/editTableRow'
  ],
  function(
    $,
    _,
    Backbone,
    Marionette,

    Forms,

    editTableRowTemplate
  ){

    var Team = { models: {}, collections: {}, views: {} };

    Team.models.Team = Backbone.Model.extend({
      idAttribute: 'label'
    });

    Team.collections.Teams = Backbone.Collection.extend({
      model: Team.models.Team,
      url: '/api/teams'
    });

    // Table CompositeView extended from form
    Team.views.editTable = Forms.views.table.extend({
      attributes: {
        id: 'form_editUsers',
        name: 'form_editUsers'
      },
      schema: {
        attributes: {
          'name': {
            type: 'text',
            title: 'Name'
          }
        }
      },
      protoModel: Team.models.Team
    });

    return Team;
  }
);
