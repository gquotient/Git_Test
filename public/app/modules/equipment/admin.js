define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.virtualCollection',

  'navigation',

  'hbs!equipment/templates/adminListItem',
  'hbs!equipment/templates/adminDetail'
], function(
  $,
  _,
  Backbone,
  Marionette,
  VirtualCollection,

  Navigation,

  adminListItemTemplate,
  adminDetailTemplate
){
  var views = {};

  function parseBaseLabel(label){
    var match = /^([A-Z]+)_/.exec(label);

    return match && match[1];
  }

  views.AdminListItem = Navigation.views.AdminListItem.extend({
    template: {
      type: 'handlebars',
      template: adminListItemTemplate
    }
  });

  views.AdminList = Navigation.views.AdminList.extend({
    itemView: views.AdminListItem,

    initialize: function(options){
      this.collection = new Backbone.VirtualCollection(options.collection, {
        close_with: this
      });

      this.dropdown = new Navigation.views.Dropdown({
        collection: new Backbone.Collection([
          {
            display_name: 'Inverters',
            extends_from: ['INV']
          },
          {
            display_name: 'Energy Meters',
            extends_from: ['RM']
          },
          {
            display_name: 'Data Aquisition',
            extends_from: ['DSS', 'DSC', 'ESI']
          },
          {
            display_name: 'Env Sensors',
            extends_from: [
              'IRRA', 'IRRZ', 'TMPC', 'TMPA', 'WSPD', 'WDIR', 'BARO', 'RAIN'
            ]
          },
          {
            display_name: 'DC Equipment',
            extends_from: ['DCB', 'APH', 'RCB', 'CMB', 'S', 'P']
          },
          {
            display_name: 'AC Equipment',
            extends_from: ['ACB', 'XFR', 'IC', 'LD']
          },
          {
            display_name: 'Base Equipment',
            filter: function(model){
              return !model.isExtension();
            }
          }
        ])
      });

      this.listenTo(this.dropdown, 'itemview:select', function(view){
        this.setCategory(view.model);
      });
    },

    ui: function(){
      var ui = _.result(Navigation.views.AdminList.prototype, 'ui');

      return _.extend({}, ui, {
        title: '.title'
      });
    },

    triggers: function(){
      var triggers = _.result(Navigation.views.AdminList.prototype, 'triggers');

      return _.extend({}, triggers, {
        'click .title': 'click:title'
      });
    },

    onShow: function(){
      var label = this.options.current,
        category;

      if (label && label.indexOf(':') < 0) {
        category = this.dropdown.collection.last();

      } else {
        label = parseBaseLabel(label);

        if (label) {
          category = this.dropdown.collection.find(function(model){
            return _.contains(model.get('extends_from'), label);
          });
        }
      }

      this.setCategory(category || this.dropdown.collection.first());
    },

    onRender: function(){
      this.$el.append(this.dropdown.render().el);
    },

    onClickTitle: function(){
      this.dropdown.$el.toggle();
    },

    setCategory: function(model){
      this.dropdown.$el.hide();

      this.ui.title.html(model.get('display_name'));

      this.collection.filter = model.get('filter') || function(equip) {
        if (!equip.isExtension()) { return false; }

        return _.contains(model.get('extends_from'), parseBaseLabel(equip.id));
      };
      this.collection._onReset();
    }
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
