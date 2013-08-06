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
    idAttribute: 'user_id',
    // Overwrite the destroy method because REST is stupid, or something
    destroy: function(options) {
      var model = this;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      return $.ajax({
        url: this.url,
        type: 'DELETE',
        dataType: 'json',
        data: this.toJSON()
      })
      .done(destroy)
      .fail(this.render);
    }
  }, {
    schema: {
      attributes: {
        'name': {
          type: 'text',
          title: 'Name',
          required: true
        },
        'email': {
          type: 'email',
          title: 'Email',
          required: true
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
    model: User.Model,
    comparator: function(user){
      return user.get('name');
    }
  });

  User.AllUsers = User.Collection.extend({
    url: '/api/users?org_label=ALL'
  });

  User.TeamUsers = User.Collection.extend({
    initialize: function(options){
      this.url = '/api/teams/' + options.team.id + '/users';
    }
  });

  User.OrganizationUsers = User.Collection.extend({
    initialize: function(options){
      this.url = '/api/organizations/' + options.org_label + '/users';
    }
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
    onResetPassword: function(){
      return $.ajax('/api/reset_password', {
        type: 'PUT',
        data: { email: this.model.get('email') }
      });
    },
    triggers: function(){
      return _.extend({}, Forms.views.tableRow.prototype.triggers, {
        'click button.reset_password': 'resetPassword'
      });
    }
  });

  // Table CompositeView extended from form
  User.views.EditTable = Forms.views.table.extend({
    fields: ['name', 'email'],
    model: User.Model,
    actions: ['edit', 'delete', 'resetPassword']
  });

  return User;
});
