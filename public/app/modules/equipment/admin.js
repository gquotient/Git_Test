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
  var views = {},

    categories = [
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
        extends_from: ['IRRA', 'IRRZ', 'TMPC', 'TMPA', 'WSPD', 'WDIR', 'BARO', 'RAIN']
      },
      {
        display_name: 'DC Equipment',
        extends_from: ['DCB', 'APH', 'RCB', 'CMB', 'S', 'P']
      },
      {
        display_name: 'AC Equipment',
        extends_from: ['ACB', 'XFR', 'IC', 'LD']
      }
    ];

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

      this.categories = new Backbone.Collection(categories);

      this.dropdown = new Navigation.views.Dropdown({
        collection: this.categories
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
      var match = /^([A-Z]+)_/.exec(this.options.current),
        label = match && match[1],
        category;

      if (label) {
        category = this.categories.find(function(model){
          return _.contains(model.get('extends_from'), label);
        });
      }

      this.setCategory(category || this.categories.first());
    },

    onRender: function(){
      this.$el.append(this.dropdown.render().el);
    },

    onClickTitle: function(){
      this.dropdown.$el.toggle();
    },

    setCategory: function(model){
      var labels = model.get('extends_from');

      this.dropdown.$el.hide();
      this.ui.title.html(model.get('display_name'));

      this.collection.filter = function(equip){
        var base = equip.getBase();

        return equip !== base && _.contains(labels, base.get('label'));
      };
      this.collection._onReset();

      this.trigger('set:category', labels);
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
          return value.toUpperCase();
        },
        validate: function(value){
          return (/^[A-Z0-9]+$/).test(value);
        },
        success: function(value){
          this.updateValues({label: value});
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
        source: function(){
          var labels = this.options.baseLabels;

          return new Backbone.VirtualCollection(this.collection, {
            filter: function(equip){

              // Only show base equipment for now.
              if (equip !== equip.getBase()) { return false; }

              // Only show the equipment for this category.
              return !labels || _.contains(labels, equip.get('label'));
            },
            close_with: this
          });
        },
        parse: function(value){
          var model = this.collection.findWhere({display_name: value});

          return model && model.id;
        },
        validate: function(value){
          return !!value;
        }
      },

      description: {
        el: '#description'
      }
    }
  });

  return views;
});
