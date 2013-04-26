define(
[
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',

  'form',

  'hbs!user/templates/item',
  'hbs!user/templates/detail',
  'hbs!user/templates/edit'
], function(
  Backbone,
  Marionette,
  MarionetteHandlebars,

  DefaultForm,

  itemTemplate,
  detailTemplate,
  editTemplate
){

  var User = { views: {} };

  User.Model = Backbone.Model.extend({});

  User.Collection = Backbone.Collection.extend({
    url: '/api/users',
    parse: function(res){
      return res.data;
    },
    model: User.Model
  });

  User.views.itemView = Backbone.Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: itemTemplate
    },
    triggers: {
      'click': 'select:user'
    },
    tagName: 'li'
  });

  User.views.listView = Backbone.Marionette.CollectionView.extend({
    itemView: User.views.itemView,
    tagName: 'ul'
  });

  User.views.detailView = Backbone.Marionette.ItemView.extend({
    model: User.Model,
    template: {
      type: 'handlebars',
      template: detailTemplate
    }
  });

  User.views.edit = DefaultForm.extend({
    attributes: {
      id: 'form_editUser',
      name: 'form_editUser'
    },
    template: {
      type: 'handlebars',
      template: editTemplate
    }
  });

  return User;

});
