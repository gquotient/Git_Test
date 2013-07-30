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

    schema: {
      display_name: {
        el: '#name'
      },

      site_label: {
        el: '#site_label',
        parse: function(value) {
          return value.replace(/\W|_/g, '');
        }
      },

      address: {
        el: '#address'
      },

      city: {
        el: '#city'
      },

      state: {
        el: '#state'
      },

      zipcode: {
        el: '#zipcode'
      },

      latitude: {
        el: '#latitude',
        parse: function(value){
          return parseFloat(value);
        },
        validate: function(value){
          return !isNaN(value);
        }
      },

      longitude: {
        el: '#longitude',
        parse: function(value){
          return parseFloat(value);
        },
        validate: function(value){
          return !isNaN(value);
        }
      }
    },

    ui: {},

    events: function(){
      var result = {};

      _.each(this.schema, function(obj, key){
        this.ui[key] = obj.el;

        result['blur ' + obj.el] = function(){
          var value = this.ui[key].val().trim(), valid;

          if (obj.parse) {
            value = obj.parse.call(this, value);
          }

          if (obj.validate) {
            valid = obj.validate.call(this, value);
          } else {
            valid = value && value !== '';
          }

          if (valid) {
            this.model.set(key, value);
          } else {
            this.ui[key].addClass('invalid');
          }
        };
      }, this);

      return result;
    },

    triggers: {
      'submit': 'save',
      'click button.edit': 'edit',
      'click button.cancel': 'cancel'
    },

    modelEvents: {
      'change': 'update',
      'destroy': 'close'
    },

    onSave: function(){
      this.$('input').blur();
      if (this.$('.invalid').length > 0) { return; }

      this.model.set({elevation: 0});

      if (!this.collection.contains(this.model)) {
        this.collection.create(this.model, {
          wait: true
        });
      }
    },

    onEdit: function(){
      if (this.collection.contains(this.model)) {
        Backbone.history.navigate('/project/' + this.model.id + '/edit', true);
      }
    },

    onCancel: function(){
      this.close();
    },

    update: function(){
      _.each(this.model.changed, function(value, key){
        if (_.has(this.ui, key)) {
          this.ui[key].val(value).removeClass('invalid');
        }
      }, this);
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

    geosearch: _.throttle(function(query){
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
    }, 1000)
  });

  return views;
});
