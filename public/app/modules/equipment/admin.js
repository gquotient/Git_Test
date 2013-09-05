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
          return (/^[A-Z]{3,}$/).test(value);
        }
      },

      description: {
        el: '#description'
      }
    },

    onShow: function(){
      var existing = !this.model.isNew(),
        events = {};

      this.ui = {};
      this.changed = {};

      _.each(this.schema, function(obj, key){
        var $el = this.$(obj.el);

        // Skip if no matching element.
        if (!$el) { return; }

        // Disable the element if not editable.
        if (existing && obj.editable === false) {
          $el.attr('disabled', true);

        // Otherwise add a validation listener.
        } else {
          events['blur ' + obj.el] = function(){
            var value = $el.val().trim();

            if (obj.parse) {
              value = obj.parse.call(this, value);
            }

            if (obj.validate && !obj.validate.call(this, value)) {
              $el.addClass('invalid');

              if (obj.error) {
                obj.error.call(this, value);
              }
            } else {
              this.changed[key] = value;

              if (obj.success) {
                obj.success.call(this, value);
              }
            }
          };
        }

        this.ui[key] = $el;
      }, this);

      this.delegateEvents(events);
    },

    isValid: function(){
      this.$el.find('input textarea').blur();
      return !this.$el.find('.invalid').length;
    },

    modelEvents: {
      'change': 'updateValues',
      'destroy': 'close'
    },

    updateValues: function(){
      _.each(this.model.changed, function(value, key){
        if (_.has(this.ui, key)) {
          this.ui[key].val(value).removeClass('invalid');
        }
      }, this);
    }
  });

  return views;
});
