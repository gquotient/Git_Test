define(
[
  "backbone",
  "backbone.marionette",
  "backbone.marionette.handlebars",

  "hbs!app/modules/user/templates/itemView",
  "hbs!app/modules/user/templates/detailView"
], function(Backbone, Marionette, MarionetteHandlebars, itemViewTemplate, detailViewTemplate){

  var User = { models: {}, views: {} };

  User.models.User = Backbone.Model.extend({});

  User.Collection = Backbone.Collection.extend({
    url: '/api/users',
    parse: function(res){
      return res.data;
    },
    model: User.models.User
  });

  User.views.itemView = Backbone.Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: itemViewTemplate
    },
    triggers: {
      'click': 'select:user'
    },
    tagName: "li"
  });

  User.views.listView = Backbone.Marionette.CollectionView.extend({
    itemView: User.views.itemView,
    tagName: "ul"
  });

  User.views.detailView = Backbone.Marionette.ItemView.extend({
    model: User.models.User,
    template: {
      type: 'handlebars',
      template: detailViewTemplate
    }
  });

  User.controller = {
    users: function(){}   
  };

  User.Router = new Backbone.Marionette.AppRouter.extend({
    controller: User.controller,

    appRoutes: {
      '/users': 'users'
    }

  });


  return User;

});