define(
[
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',

  'form',

  'hbs!user/templates/item',
  'hbs!user/templates/detail',
  'hbs!user/templates/edit',
  'hbs!user/templates/editTableRow'
], function(
  Backbone,
  Marionette,
  MarionetteHandlebars,

  Forms,

  itemTemplate,
  detailTemplate,
  editTemplate,
  editTableRowTemplate
){

  var User = { views: {} };

  User.Model = Backbone.Model.extend({
    url: '/api/users',
    idAttribute: 'email'
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

  // Table row edit ItemView extended from form ItemView
  User.views.editTableRow = Forms.views.tableRow.extend({
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
  User.views.editTable = Forms.views.table.extend({
    attributes: {
      id: 'form_editUsers',
      name: 'form_editUsers'
    },
    itemView: User.views.editTableRow,
    onRender: function(){
      // Add the table header cells
      // NOTE: there's gotta be a smarter way to do this
      this.$el.find('thead > tr').html('<th>Name</th><th>Email</th><th>Actions</th>');
    }
  });

  return User;

});
