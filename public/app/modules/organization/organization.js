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

    var Organization = { models: {}, collections: {}, views: {} };

    Organization.models.Organization = Backbone.Model.extend({
      url: '/api/organizations'
    }, {
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
      }
    });

    Organization.collections.Organizations = Backbone.Collection.extend({
      model: Organization.models.Organization,
      url: '/api/organizations'
    });

    // Table CompositeView extended from form
    Organization.views.EditTable = Forms.views.table.extend({
      fields: ['name', 'type'],
      model: Organization.models.Organization,
      actions: true
    });

    return Organization;
  }
);
