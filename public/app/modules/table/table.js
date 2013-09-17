define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handsontable',

  './dropdown',

  'css!bower_components/handsontable/dist/jquery.handsontable.css'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handsontable,

  Dropdown,

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
      var method = options.name.replace(/\W+/g, ''),
        getter = _.bind(this['get' + method] || this.defaultGet, this),
        setter = _.bind(this['set' + method] || this.defaultSet, this),
        omit = ['name', 'attr'],
        col = {};

      _.each(options, function(value, key) {
        if (_.contains(omit, key)) { return; }
        col[key] = _.isFunction(value) ? _.bind(value, this) : value;
      }, this);

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

    onShowCalled: function(){
      this.update();
    },

    addRow: function(row){
      var index;

      if (this.comparator) {
        index = _.sortedIndex(this._rows, row, this.comparator, this);
      } else {
        index = this._rows.length;
      }

      this._rows.splice(index, 0, row);
      this.update();
    },

    removeRow: function(row){
      var index = _.indexOf(this._rows, row);

      if (index !== -1) {
        this._rows.splice(index, 1);
        this.update();
      }
    },

    resetRows: function(){
      this._rows.length = 0;

      if (this.collection) {
        this.collection.each(this.addRow, this);
      }

      this.renderTable();
    },

    update: function(){
      if (this._rows.length === 0) {
        this.closeTable();

      } else if (this.table) {
        this.table.render();

      } else {
        this.renderTable();
      }
    },

    render: function(){
      this.isClosed = false;
      this.triggerMethod('before:render', this);
      this.resetRows();
      this.triggerMethod('render', this);

      return this;
    },

    renderTable: function(){
      var that = this, options;

      // Hack to avoid errors when $.contextMenu plugin doesn't exist
      if (!_.isFunction($.contextMenu)) {
        $.contextMenu = function() {};
      }

      this.closeTable();

      if (this._rows.length > 0) {
        options = {
          columns: this._columns,
          colHeaders: _.pluck(this.columns, 'name'),
          data: this._rows,
          height: _.bind(this.$el.height, this.$el),
          observeChanges: false,

          afterChange: function(changes, source){
            var models = [],
              seen = [];

            _.each(changes, function(row){
              var model;

              // Don't include duplicate models or non-changes.
              if (_.contains(seen, row[0]) || _.isEqual(row[2], row[3])) {
                return;
              }

              seen.push(row[0]);
              model = that.table.getDataAtRow(row[0]);

              if (model) {
                models.push(model);
              }
            });

            if (models.length) {
              that.triggerMethod('after:change', models, source);
            }
          }
        };

        _.each(this.tableOptions, function(value, key){
          options[key] = _.isFunction(value) ? _.bind(value, that) : value;
        });

        this.$el.handsontable(options);
        this.table = this.$el.handsontable('getInstance');
      }
    },

    close: function(){
      this.closeTable();
      Marionette.View.prototype.close.apply(this, arguments);
    },

    closeTable: function(){
      if (this.table) {
        this.table.destroy();
      }
    }
  });
});
