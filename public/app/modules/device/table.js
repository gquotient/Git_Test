define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'handsontable',
  'css!bower_components/handsontable/dist/jquery.handsontable.css'
], function(
  $,
  _,
  Backbone,
  Marionette,

  handsontable,
  handsontableCSS
){
  var

    DataInterface = function(options){
      _.extend(this, _.omit(options, 'columns', 'rows'));

      this.columns = [];
      this.data = [];

      _.each(options.columns, this.addColumn, this);
      _.each(options.rows, this.addRow, this);

      if (!this.colHeaders) {
        this.colHeaders = _.pluck(this.columns, 'name');
      }
    };


  _.extend(DataInterface.prototype, {
    addColumn: function(col){
      var data = col.data;

      if (data && _.isString(data)) {
        col.data = function(model, value){
          if (arguments.length < 2) {
            return model.get(data);
          }

          model.save(data, value);
        };
      }

      this.columns.push(col);
    },

    addRow: function(row){
      var index;

      if (this.comparator) {
        index = _.sortedIndex(this.data, row, this.comparator, this);
        this.data.splice(index, 0, row);
      } else {
        this.data.push(row);
      }
    }
  });


  return Marionette.View.extend({

    attributes: {
      id: 'device-table'
    },

    initialize: function(){
      this.iface = new DataInterface({
        rows: this.collection.models,
        columns: [
          {
            name: 'ID',
            data: 'did',
            readOnly: true
          },
          {
            name: 'Name',
            data: 'name'
          },
          {
            name: 'Equipment',
            data: function(model, value){
              return model.equipment.get('name');
            },
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
        columnSorting: true,
        stretchH: 'all'
      });
    },

    onShow: function(){
      this.$el.handsontable(this.iface);
    }
  });
});
