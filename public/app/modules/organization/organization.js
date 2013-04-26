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
      url: '/api/organizations'
    });

    Organization.collection.Organizations = Backbone.Collection.extend({
      model: Organization.models.Organization
    });

    return Organization;
  }
);
