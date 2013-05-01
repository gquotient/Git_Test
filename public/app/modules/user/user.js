define(
[
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',

  'form',

  'hbs!user/templates/item',
  'hbs!user/templates/detail',
  'hbs!user/templates/edit',
  'hbs!user/templates/editTableRow',
  'hbs!user/templates/newTableRow'
], function(
  Backbone,
  Marionette,
  MarionetteHandlebars,

  Forms,

  itemTemplate,
  detailTemplate,
  editTemplate,
  editTableRowTemplate,
  newTableRowTemplate
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

  User.views.newTableRow = Forms.views.tableRow.extend({
    template: {
      type: 'handlebars',
      template: newTableRowTemplate
    },
    events: {
      'click button.create': function(event){
        event.preventDefault();
        this.model.set('name', this.$el.find('input[name=name]').val());
        this.model.set('email', this.$el.find('input[name=email]').val());
        this.model.set('org_label', this.$el.find('input[name=org_label]').val());
        Backbone.sync('create', this.model);
        this.collection.add(this.model);
        this.close();
      }
    }
  });

  // Table CompositeView extended from form
  User.views.editTable = Forms.views.table.extend({
    attributes: {
      id: 'form_editUsers',
      name: 'form_editUsers'
    },
    schema: {
      attributes: {
        'name': 'Name',
        'email': 'Email',
        'org_label': 'Org Label'
      }
    },
    itemView: User.views.editTableRow,
    events: {
      'click button.add': function(event){
        event.preventDefault();
        var newUser = new User.Model();
        var newUserView = new User.views.newTableRow({model: newUser, collection: this.collection});
        this.$el.find('tbody').append( newUserView.render().el );
      }
    }
  });

  return User;

});
