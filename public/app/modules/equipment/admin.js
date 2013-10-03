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
      this.collection = new Form.util.Collection(options.collection, {
        close_with: this
      });

      this.categories = new Backbone.Collection(categories);

      this.dropdown = new Form.views.Dropdown({
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
          return _.contains(model.get('base_labels'), label);
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
      var labels = model.get('base_labels');

      this.dropdown.$el.hide();
      this.ui.title.html(model.get('name'));

      this.collection.updateFilter(function(equip){
        var base = equip.getBase();

        return equip !== base && _.contains(labels, base.get('label'));
      });

      this.trigger('set:category', labels);
    }
  });

  views.AdminDetail = Form.views.Admin.extend({
    template: {
      type: 'handlebars',
      template: adminDetailTemplate
    },

    templateHelpers: function(){
      var attrs = _.difference(_.keys(this._schema), _.keys(this.schema));

      return {
        inherits: this.model.getBase().get('name'),
        items: _.map(attrs, function(attr){
          return {
            name: this._schema[attr].name,
            value: this.model.get(attr),
            attr: attr
          };
        }, this)
      };
    },

    modelEvents: {
      'destroy': 'close'
    },

    schema: {
      name: {},
      label: {
        parse: function(value){
          return value.toUpperCase();
        },
        success: function(value){
          this.updateValues({label: value});
        }
      },
      description: {},
      make: {},
      model: {},
      inherits: {
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
          var model = this.collection.findWhere({name: value});

          return model && model.id;
        }
      }
    }
  });

  return views;
});
