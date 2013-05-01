define(
  [
    'jquery',
    'underscore',
    'backbone',
    'backbone.marionette',

    'form',

    'hbs!organization/templates/editTableRow'
  ],
  function(
    $,
    _,
    Backbone,
    Marionette,

    Forms,

    editTableRowTemplate
  ){

    var Organization = { models: {}, collections: {}, views: {} };

    Organization.models.Organization = Backbone.Model.extend({
    });

    Organization.collections.Organizations = Backbone.Collection.extend({
      model: Organization.models.Organization,
      url: '/api/organizations'
    });

    // Table row edit ItemView extended from form ItemView
    Organization.views.editTableRow = Forms.views.tableRow.extend({
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
    Organization.views.editTable = Forms.views.table.extend({
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
          'type': {
            type: 'select',
            title: 'Type',
            options: {
              'unspecified': 'unspecified',
              'vendor': 'vendor'
            }
          }
        }
      },
      protoModel: Organization.models.Organization
    });

    return Organization;
  }
);
