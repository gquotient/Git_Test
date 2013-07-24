define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!project/templates/adminList',
  'hbs!project/templates/adminListItem',
  'hbs!project/templates/adminCreate'
], function(
  $,
  _,
  Backbone,
  Marionette,

  adminListTemplate,
  adminListItemTemplate,
  adminCreateTemplate
){
  var views = {};

  views.AdminListItem = Marionette.ItemView.extend({
    tagName: 'tr',
    template: {
      type: 'handlebars',
      template: adminListItemTemplate
    },

    triggers: {
      'click button.edit': 'edit',
      'click button.delete': 'delete'
    },

    onEdit: function(){
      Backbone.history.navigate('/project/' + this.model.id + '/edit', true);
    },

    onDelete: function(){
      this.model.destroy({
        wait: true
      });
    }
  });

  views.AdminList = Marionette.CompositeView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: adminListTemplate
    },

    itemView: views.AdminListItem,
    itemViewContainer: 'tbody',

    triggers: {
      'click button.add': 'create'
    }
  });

  views.AdminCreate = Marionette.ItemView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: adminCreateTemplate
    },

    ui: {
      'name': '#name',
      'label': '#site_label',
      'latitude': '#latitude',
      'longitude': '#longitude',
      'elevation': '#elevation'
    },

    triggers: {
      'submit': 'submit',
      'reset': 'reset',
      'click button.cancel': 'cancel'
    },

    onSubmit: function(){
      var user = this.options.user;

      this.collection.create({
        display_name: this.ui.name.val().trim(),
        site_label: this.ui.label.val().replace(/\W|_/g, ''),
        latitude: parseFloat(this.ui.latitude.val()),
        longitude: parseFloat(this.ui.longitude.val()),
        elevation: parseFloat(this.ui.elevation.val()) || 0
      }, {
        wait: true,
        success: function(model){
          model.log('created project', user);
        }
      });

      this.close();
    },

    onReset: function(){
      this.render();
    },

    onCancel: function(){
      this.close();
    }
  });

  return views;
});
