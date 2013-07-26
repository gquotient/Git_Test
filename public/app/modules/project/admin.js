define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!project/templates/adminList',
  'hbs!project/templates/adminListItem',
  'hbs!project/templates/adminEdit',
  'hbs!project/templates/adminGeosearch'
], function(
  $,
  _,
  Backbone,
  Marionette,

  adminListTemplate,
  adminListItemTemplate,
  adminEditTemplate,
  adminGeosearchTemplate
){
  var views = {};

  views.AdminListItem = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: adminListItemTemplate
    },

    triggers: {
      'click a': 'edit',
      'click button.delete': 'delete'
    },

    onDelete: function(){
      if (window.confirm('Are you sure you want to delete this prject?')) {
        this.model.destroy({
          wait: true
        });
      }
    }
  });

  views.AdminList = Marionette.CompositeView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: adminListTemplate
    },

    itemView: views.AdminListItem,
    itemViewContainer: 'ul',

    triggers: {
      'click button.create': 'create'
    }
  });

  views.AdminEdit = Marionette.ItemView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: adminEditTemplate
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

    modelEvents: {
      'change': 'render'
    },

    onSubmit: function(){
      var that = this;

      this.model.set({
        display_name: this.ui.name.val().trim(),
        site_label: this.ui.label.val().replace(/\W|_/g, ''),
        latitude: parseFloat(this.ui.latitude.val()),
        longitude: parseFloat(this.ui.longitude.val()),
        elevation: parseFloat(this.ui.elevation.val()) || 0
      });

      this.collection.create(this.model, {
        wait: true,
        success: function(model){
          model.log('created project', that.options.user);
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

  views.AdminGeosearch = Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: adminGeosearchTemplate
    },

    attributes: {
      id: 'geosearch'
    },

    ui: {
      input: 'input'
    },

    events: {
      'keyup': function(e){
        switch (e.which) {
        case 13:
          this.geosearch(this.ui.input.val());
          break;

        case 27:
          this.ui.input.val('');
          this.ui.input.blur();
          break;
        }
      },

      'mousedown input': function(e){
        e.stopPropagation();
      }
    },

    geosearch: function(query){
      var that = this;

      $.getJSON('http://nominatim.openstreetmap.org/search', {
        q: query,
        limit: 1,
        format: 'json',
        addressdetails: true
      }).done(function(data){
        if (data.length > 0) {
          that.triggerMethod('found', data[0]);
        }
      });
    }
  });

  return views;
});
