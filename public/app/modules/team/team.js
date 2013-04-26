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
    });

    Team.collections.Teams = Backbone.Collection.extend({
      model: Team.models.Team,
      url: '/api/organizations'
    });

    return Team;
  }
);
