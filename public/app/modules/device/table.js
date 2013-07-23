define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'table'
], function(
  $,
  _,
  Backbone,
  Marionette,

  TableView
){
  return TableView.extend({

    attributes: {
      id: 'device-table'
    },

    columns: [
      {
        name: 'ID',
        attr: 'did',
        readOnly: true
      },
      {
        name: 'Name',
        attr: 'name'
      },
      {
        name: 'Equipment',
        readOnly: true
      }
    ],

    tableOptions: {
      columnSorting: true,
      stretchH: 'all'
    },

    initialize: function(options){
      if (!options.editable) {
        this.tableOptions.readOnly = true;
      }
    },

    collectionEvents: {
      'change': function(model) {
        if (this.options.editable) {
          model.lazySave();
        }
      }
    },

    comparator: function(model){
      var equip = model.equipment,
        order = equip ? '' + equip.get('order') : '9999';

      while (order.length < 4) {
        order = '0' + order;
      }

      return [order, model.get('name')];
    },

    getEquipment: function(model){
      return model.equipment.get('name');
    }
  });
});
