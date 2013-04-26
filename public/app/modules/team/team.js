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

    var Team = { models: {}, collections: {} };

    Team.models.Team = Backbone.Model.extend({
      url: '/api/organizations'
    });

    Team.collection.Teams = Backbone.Collection.extend({
      model: Team.models.Team
    });

    return Team;
  }
);
