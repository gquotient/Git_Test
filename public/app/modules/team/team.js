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
    });

    Team.collections.Teams = Backbone.Collection.extend({
      model: Team.models.Team,
      url: '/api/teams'
    });

    // Table row edit ItemView extended from form ItemView
    Team.views.editTableRow = Forms.views.tableRow.extend({
      attributes: {
        id: 'form_editUser',
        name: 'form_editUser'
      },
      template: {
        type: 'handlebars',
        template: editTableRowTemplate
      }
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
          },
          'label': {
            type: 'text',
            title: 'Label'
          }
        }
      },
      itemView: Team.views.editTableRow
    });

    return Team;
  }
);
