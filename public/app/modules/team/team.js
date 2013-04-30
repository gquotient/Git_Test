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
      itemView: Team.views.editTableRow,
      onRender: function(){
        // Add the table header cells
        // NOTE: there's gotta be a smarter way to do this
        this.$el.find('thead > tr').html('<th>Name</th><th>Label</th>');
      }
    });

    return Team;
  }
);
