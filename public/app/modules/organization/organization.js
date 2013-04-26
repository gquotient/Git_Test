define(
  [
    'jquery',
    'underscore',
    'backbone',
    'backbone.marionette'
  ],
  function(
    $,
    _,
    Backbone,
    Marionette
  ){

    var Organization = { models: {}, collections: {} };

    Organization.models.Organization = Backbone.Model.extend({
    });

    Organization.collections.Organizations = Backbone.Collection.extend({
      model: Organization.models.Organization,
      url: '/api/organizations'
    });

    return Organization;
  }
);
