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
  Handsontable,

  handsontableCSS
){
  return Marionette.View.extend({

    constructor: function(){
      var cols = _.result(this, 'columns');

      this._columns = _.map(cols, this._configureColumn, this);
      this._rows = [];

      Marionette.View.prototype.constructor.apply(this, arguments);

      this._initialEvents();
    },

    _configureColumn: function(options){
      var name = options.name,
        getter = _.bind(this['get' + name] || this.defaultGet, this),
        setter = _.bind(this['set' + name] || this.defaultSet, this),
        col = _.omit(options, 'name', 'attr');

      col.data = function(row, value){
        if (arguments.length < 2) {
          return getter(row, options);
        }

        setter(row, value, options);
      };

      return col;
    },

    defaultGet: function(row, options){
      return row.get(options.attr);
    },

    defaultSet: function(row, value, options){
      row.set(options.attr, value);
    },

    _initialEvents: function(){
      if (this.collection) {
        this.listenTo(this.collection, 'add', this.addRow);
        this.listenTo(this.collection, 'remove', this.removeRow);
        this.listenTo(this.collection, 'reset', this.resetRows);
      }
    },

    addRow: function(row){
      var index;

      if (this.comparator) {
        index = _.sortedIndex(this._rows, row, this.comparator, this);
      } else {
        index = this._rows.length;
      }

      this._rows.splice(index, 0, row);

      if (this.table) {
        this.table.render();
      }
    },

    removeRow: function(row){
      var index = _.indexOf(this._rows, row);

      if (index !== -1) {
        this._rows.splice(index, 1);
      }

      if (this.table) {
        this.table.render();
      }
    },

    resetRows: function(){
      this._rows.length = 0;

      if (this.collection) {
        this.collection.each(this.addRow, this);
      }

      if (this.table) {
        this.table.render();
      }
    },

    onShowCalled: function(){
      if (this.table) {
        this.table.render();
      }
    },

    render: function(){
      this.isClosed = false;
      this.triggerMethod('before:render', this);
      this.renderTable();
      this.triggerMethod('render', this);

      return this;
    },

    renderTable: function(){
      this.closeTable();
      this.resetRows();

      if (this._rows.length > 0) {
        this.$el.handsontable(_.extend({
          columns: this._columns,
          colHeaders: _.pluck(this.columns, 'name'),
          data: this._rows,
          height: _.bind(this.$el.height, this.$el)
        }, this.tableOptions));

        this.table = this.$el.handsontable('getInstance');
      }
    },

    close: function(){
      this.closeTable();
      Marionette.View.prototype.close.apply(this, arguments);
    },

    closeTable: function(){
      if (this.table) {

        // Hack to avoid errors when $.contextMenu plugin doesn't exist
        if (!_.isFunction($.contextMenu)) {
          $.contextMenu = function() {};
        }

        this.table.destroy();
      }
    }
  });
});
