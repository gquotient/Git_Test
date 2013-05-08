define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'form',

  'hbs!user/templates/item',
  'hbs!user/templates/detail',
  'hbs!user/templates/edit'
],
function(
  $,
  _,
  Backbone,
  Marionette,

  Forms,

  itemTemplate,
  detailTemplate,
  editTemplate
){
  var User = { views: {} };

  User.Model = Backbone.Model.extend({
    url: '/api/users',
    idAttribute: 'email'
  }, {
    schema: {
      attributes: {
        'name': {
          type: 'text',
          title: 'Name'
        },
        'email': {
          type: 'text',
          title: 'Email'
        },
        'org_label': {
          type: 'text',
          title: 'Org Label'
        }
      }
    }
  });

  User.Collection = Backbone.Collection.extend({
    url: '/api/users',
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

  // Basic single user form edit view
  User.views.edit = Forms.views.basic.extend({
    attributes: {
      id: 'form_editUser',
      name: 'form_editUser'
    },
    template: {
      type: 'handlebars',
      template: editTemplate
    }
  });

  User.views.EditRow = Forms.views.tableRow.extend({
    events: function(){
      return _.extend({}, Forms.views.tableRow.prototype.events, {

      });
    }
  });

  // Table CompositeView extended from form
  User.views.EditTable = Forms.views.table.extend({
    fields: ['name', 'email'],
    itemView: User.views.EditRow,
    model: User.Model,
    actions: ['edit', 'cancel', 'save']
  });

  return User;
});
