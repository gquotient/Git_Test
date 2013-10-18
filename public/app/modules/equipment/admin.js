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

    categories: [
      {
        name: 'Inverters',
        base_labels: ['INV']
      },
      {
        name: 'Energy Meters',
        base_labels: ['RM']
      },
      {
        name: 'Data Aquisition',
        base_labels: ['DSS', 'DSC', 'ESI']
      },
      {
        name: 'Env Sensors',
        base_labels: ['IRRA', 'IRRZ', 'TMPC', 'TMPA', 'WSPD', 'WDIR', 'BARO', 'RAIN']
      },
      {
        name: 'DC Equipment',
        base_labels: ['DCB', 'APH', 'RCB', 'CMB', 'S', 'P']
      },
      {
        name: 'AC Equipment',
        base_labels: ['ACB', 'XFR', 'IC', 'LD']
      }
    ],

    initialize: function(options){
      this.collection = new Form.util.Collection(options.collection, {
        close_with: this
      });
    },

    onShow: function(){
      var match = /^([A-Z]+)_/.exec(this.options.current),
        label = match && match[1],
        category;

      if (label) {
        category = this.categories.find(function(model){
          return _.contains(model.get('base_labels'), label);
        });
      }

      category = category || this.categories.first();

      this.triggerMethod('change:category', category);
    },

    onChangeCategory: function(model){
      this.triggerMethod('filter', {labels: model.get('base_labels')});
    },

    onFilter: function(filters){
      this.collection.updateFilter(function(equip){
        var base = equip.getBase();

        return equip !== base && _.contains(filters.labels, base.get('label'));
      });
    }
  });

  views.AdminDetail = Form.views.Admin.extend({
    template: {
      type: 'handlebars',
      template: adminDetailTemplate
    },

    templateHelpers: function(data){
      return {
        // Any required fields that aren't in the view schema.
        items: _.reduce(this._schema, function(memo, params, attr){
          if (params.required && !_.has(this.schema, attr)) {
            memo.push({
              name: params.name,
              value: data[attr],
              attr: attr
            });
          }
          return memo;
        }, [], this)
      };
    },

    modelEvents: {
      'destroy': 'close'
    },

    schema: {
      manufacturer: {},
      model: {},
      name: {},
      label: {
        parse: function(value){
          return value.toUpperCase();
        },
        success: function(value){
          this.updateValues({label: value});
        }
      },
      inherits: {
        source: function(){
          var filters = this.options.filters || {},
            labels = filters.labels;

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
        render: function(value){
          var inherits = this.collection.get(value);
          return inherits ? inherits.get('name') : '';
        },
        parse: function(value){
          var model = this.collection.findWhere({name: value});
          return model && model.id;
        },
        success: function(value){
          this.model.set({inherits: value});
          this.delegateEvents();
          this.render();
        }
      },
      ddl: {},
      interface_module: {},
      description: {}
    }
  });

  return views;
});
