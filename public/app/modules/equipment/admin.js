define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.virtualCollection',

  'navigation',
  'form',

  'hbs!equipment/templates/adminListItem',
  'hbs!equipment/templates/adminDetail'
], function(
  $,
  _,
  Backbone,
  Marionette,
  VirtualCollection,

  Navigation,
  Form,

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
            base: true
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
        category, match;

      if (label && label.indexOf(':') < 0) {
        category = this.dropdown.collection.findWhere({base: true});

      } else {
        match = /^([A-Z]+)_/.exec(label);
        label = match && match[1];

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
      var isBase = model.get('base') || false;

      this.dropdown.$el.hide();
      this.ui.title.html(model.get('display_name'));

      this.collection.filter = model.get('filter') || function(equip) {
        var base = equip.getBase();

        if (equip === base) {
          return isBase;
        } else {
          return _.contains(model.get('extends_from'), base.get('label'));
        }
      };
      this.collection._onReset();
    }
  });

  views.AdminDetail = Form.views.Admin.extend({
    template: {
      type: 'handlebars',
      template: adminDetailTemplate
    },

    templateHelpers: function(){
      return {
        extension: this.model.isNew() || this.model.getBase() !== this.model
      };
    },

    modelEvents: {
      'destroy': 'close'
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
    }
  });

  return views;
});
