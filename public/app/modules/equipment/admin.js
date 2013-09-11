define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'navigation',

  'hbs!equipment/templates/adminListItem',
  'hbs!equipment/templates/adminDetail'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Navigation,

  adminListItemTemplate,
  adminDetailTemplate
){
  var views = {};

  views.AdminListItem = Navigation.views.AdminListItem.extend({
    template: {
      type: 'handlebars',
      template: adminListItemTemplate
    }
  });

  views.AdminList = Navigation.views.AdminList.extend({
    itemView: views.AdminListItem
  });

  views.AdminDetail = Marionette.ItemView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: adminDetailTemplate
    },

    templateHelpers: function(){
      return {
        extension: this.model.isNew() || this.model.isExtension()
      };
    },

    schema: {
      display_name: {
        el: '#name',
        validate: function(value){
          return value && value !== '';
        }
      },

      label: {
        el: '#label',
        editable: false,
        parse: function(value){
          return value.toUpperCase().replace(/[^A-Z]+/g, '');
        },
        validate: function(value){
          return (/^[A-Z]+$/).test(value);
        }
      },

      make: {
        el: '#make'
      },

      model: {
        el: '#model'
      },

      extends_from: {
        el: '#extends',
        editable: false,
        parse: function(value){
          var model;

          if (value) {
            model = this.collection.getEquipment(value);
            value = model ? model.id : 'invalid';
          }

          return value;
        },
        validate: function(value){
          return value !== 'invalid';
        }
      },

      description: {
        el: '#description'
      }
    },

    initialize: function(){
      this.changed = {};
    },

    ui: function(){
      return _.reduce(this.schema, function(memo, obj, key){
        memo[key] = obj.el;

        return memo;
      }, {});
    },

    events: function(){
      return _.reduce(this.schema, function(memo, obj, key){
        memo['blur ' + obj.el] = function(){
          var $el = this.ui[key],
            value = $el.val().trim();

          if (obj.parse) {
            value = obj.parse.call(this, value);
          }

          if (obj.validate && !obj.validate.call(this, value)) {
            $el.addClass('invalid');

            if (obj.error) {
              obj.error.call(this, value);
            }
          } else {
            $el.removeClass('invalid');

            this.changed[key] = value;

            if (obj.success) {
              obj.success.call(this, value);
            }
          }
        };

        return memo;
      }, {});
    },

    modelEvents: {
      'change': 'render',
      'destroy': 'close'
    },

    onRender: function(){
      var existing = !this.model.isNew();

      _.each(this.schema, function(obj, key){
        var $el = this.ui[key];

        // Skip if no matching element.
        if (!$el) { return; }

        // Disable the element if not editable.
        if (existing && obj.editable === false) {
          $el.attr('disabled', true);
        }
      }, this);

      this.changed = {};
    },

    isValid: function(){
      this.$el.find('input textarea').blur();
      return !this.$el.find('.invalid').length;
    }
  });

  return views;
});
