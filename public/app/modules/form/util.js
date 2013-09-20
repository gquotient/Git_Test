define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.virtualCollection'
], function(
  $,
  _,
  Backbone,
  Marionette,
  VirtualCollection
){
  var util = {};

  function comparator(a, b){
    if (a !== b) {
      if (a > b || a === void 0) { return 1; }
      if (a < b || b === void 0) { return -1; }
    }
    return 0;
  }

  function naturalSplit(str){
    return _.map(str.match(/(\.\d+)|(\d+)|(\D+)/g), function(part){
      var num = parseInt(part, 10);

      return isNaN(num) ? part : num;
    });
  }

  function multiPart(a, b, sorter, context){
    var result;

    a = _.clone(a);
    b = _.clone(b);

    if (_.isArray(a) && _.isArray(b)) {
      while (a.length || b.length) {
        result = sorter.call(context, a.shift(), b.shift());
        if (result !== 0) { return result; }
      }
    } else {
      result = sorter.call(context, a, b);
    }

    return result;
  }

  // Sort that takes optional iterator and sorter functions and sorts array
  // elements properly instead of joining them into a string.
  util.naturalSort = function(obj, options, context){
    options = options || {};

    var iterator = options.iterator || _.identity,
      sorter = options.sorter || comparator;

    if (options.natural) {
      iterator = _.wrap(iterator, function(func){
        var args = Array.prototype.slice.apply(arguments),
          result = func.apply(context, args.slice(1));

        return _.isString(result) ? naturalSplit(result) : result;
      });
    }

    return _.pluck(_.map(obj, function(value, index, list){
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right){
      var result = multiPart(left.criteria, right.criteria, sorter, context);

      if (result !== 0) { return result; }

      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  util.sortedIndex = function(array, obj, options, context){
    options = options || {};

    var iterator = options.iterator || _.identity,
      sorter = options.sorter || comparator,
      low = 0, high = array.length, mid, value, other;

    if (options.natural) {
      iterator = _.wrap(iterator, function(func){
        var args = Array.prototype.slice.apply(arguments),
          result = func.apply(context, args.slice(1));

        return _.isString(result) ? naturalSplit(result) : result;
      });
    }

    value = iterator.call(context, obj);

    while (low < high) {
      mid = Math.floor((low + high) / 2);
      other = iterator.call(context, array[mid]);

      if (multiPart(value, other, sorter, context) > 0) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return low;
  };

  util.Collection = Marionette.extend.call(Backbone.VirtualCollection, {

    pluck: function(attr){
      return _.invoke(this._models(), 'get', attr);
    },

    where: Backbone.Collection.prototype.where,

    findWhere: function(attrs){
      return this.where(attrs, true);
    },

    updateFilter: function(filter, options){
      options = options || {};

      this.filter = filter || function(){ return true; };
      this._rebuildIndex();

      if (!options.silent) {
        this.trigger('reset', this, options);
      }
    },

    sort: function(options){
      var iterator, sorter;

      if (!this.comparator) {
        throw new Error('Cannot sort a set without a comparator');
      }

      options = options || {};

      if (_.isString(this.comparator)) {
        iterator = function(model){
          return model.get(this.comparator);
        };

      } else if (this.comparator.length === 1){
        iterator = this.comparator;

      } else {
        iterator = _.identity;
        sorter = this.comparator;
      }

      this.index = util.naturalSort(this.index, {
        iterator: function(cid, index, list){
          return iterator.call(this, this.collection.get(cid), index, list);
        },
        sorter: sorter,
        natural: true
      }, this);

      if (!options.silent) {
        this.trigger('sort', this, options);
      }

      return this;
    }
  });

  return util;
});
