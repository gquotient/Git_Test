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

    initialize: function(options){
      this.equipment = options.equipment;
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
        type: 'dropdown',
        source: function(model){
          var base = model.equipment && model.equipment.getBase(),
            source = base && base.getExtends();

          return _.invoke(source, 'get', 'display_name');
        }
      }
    ],

    tableOptions: {
      columnSorting: true,
      stretchH: 'all',
      fillHandle: 'vertical',
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

    onAfterChange: function(models, source){
      _.invoke(models, 'lazySave');
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
      return model.equipment.get('display_name');
    },

    setEquipment: function(model, value){
      var equip = this.equipment.findWhere({display_name: value});

      if (equip) {
        model.set({equipment_label: equip.id});
        model.equipment = equip;
      }
    }
  });
});
