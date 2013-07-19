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

    collectionEvents: {
      'change': function(model) {
        model.lazySave();
      }
    },

    tableOptions: {
      columnSorting: true,
      stretchH: 'all'
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
