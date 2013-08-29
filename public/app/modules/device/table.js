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
      stretchH: 'all',
      readOnly: true
    },

    modelEvents: {
      'change:editor': 'updateReadOnly'
    },

    updateReadOnly: function(){
      if (this.table) {
        this.table.updateSettings({readOnly: !this.model.isEditable()});
      }
    },

    onShow: function(){
      this.updateReadOnly();
    },

    collectionEvents: {
      'change': function(model) {
        model.lazySave();
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
