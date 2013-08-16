define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.virtualCollection',

  'hbs!project/templates/dropdown',
  'hbs!project/templates/dropdownItem'
], function(
  $,
  _,
  Backbone,
  Marionette,
  VirtualCollection,

  dropdownTemplate,
  dropdownItemTemplate
){
  var

    DropdownItemView = Marionette.ItemView.extend({
      tagName: 'li',
      template: {
        type: 'handlebars',
        template: dropdownItemTemplate
      },

      triggers: {
        'mousedown a': 'select'
      }
    }),

    DropdownView = Marionette.CompositeView.extend({
      template: {
        type: 'handlebars',
        template: dropdownTemplate
      },

      templateHelpers: function(){
        return {
          applyAll: this.options.applyAll && this.collection.length > 0
        };
      },

      itemView: DropdownItemView,
      itemViewContainer: 'ul',

      className: 'editorDropdown',

      triggers: {
        'mousedown a.all': 'select:all'
      },

      // Use the collection view version so that reset causes everything to render.
      _initialEvents: Marionette.CollectionView.prototype._initialEvents
    }),

    Collection = Backbone.Collection.extend.call(Backbone.VirtualCollection, {

      pluck: function(attr){
        return _.invoke(this._models(), 'get', attr);
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

        this.index = sort(this.index, {
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

  // Sort that takes optional iterator and sorter functions and sorts array
  // elements properly instead of concatenating them.
  function sort(obj, options, context){
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
      var a, b, result;

      a = _.clone(left.criteria);
      b = _.clone(right.criteria);

      if (_.isArray(a) && _.isArray(b)) {
        while (a.length || b.length) {
          result = sorter.call(context, a.shift(), b.shift());
          if (result !== 0) { return result; }
        }
      } else {
        result = sorter.call(context, a, b);
        if (result !== 0) { return result; }
      }

      return left.index < right.index ? -1 : 1;
    }), 'value');
  }


  return Marionette.View.extend({

    constructor: function(options){
      options.collection = options.collection || new Backbone.Collection();
      Marionette.View.prototype.constructor.call(this, options);

      this._collection = new Collection(this.collection, {
        comparator: options.comparator,
        close_with: this
      });

      this.ui = {input: this.$('input')};
      this.placeholder = this.ui.input.val();

      this.dropdown = new DropdownView({
        collection: this._collection,
        applyAll: options.applyAll
      });
      this.$el.append(this.dropdown.el);

      this.listenTo(this.dropdown, 'itemview:select', function(view){
        this.triggerMethod('key:enter', view.model);
      });

      this.listenTo(this.dropdown, 'select:all', function(){
        this._collection.each(function(model){
          this.triggerMethod('key:enter', model);
        }, this);
      });

      _.bindAll(this, 'handleKeyEvent');
      $(document).on('keydown keypress', this.handleKeyEvent);
    },

    triggers: {
      'focus input': 'focus',
      'blur input': 'blur',
      'input input': 'input'
    },

    keydownEvents: {
      9: 'key:tab',
      13: 'key:enter',
      27: 'key:esc',
      38: 'key:up',
      40: 'key:down'
    },

    handleKeyEvent: function(e){
      var value = (this[e.type + 'Events'] || {})[e.which];

      if (value && this.focused) {
        e.preventDefault();
        this.triggerMethod(value);

      } else if (this.options.hotKey && e.which === this.options.hotKey) {

        if (!_.contains(['INPUT', 'TEXTAREA'], e.target.nodeName)) {
          e.preventDefault();
          this.triggerMethod('hotkey');
        }
      }
    },

    onClose: function(){
      $(document).off('keydown keypress', this.handleKeyEvent);
    },

    onFocus: function(){
      this.ui.input.val('');
      this._collection.updateFilter();
      this.dropdown.$el.show();
      this.focused = true;
    },

    onBlur: function(){
      this.ui.input.val(this.placeholder);
      this.dropdown.$el.hide();
      this.focused = false;
    },

    parseInput: function(){
      return this.ui.input.val();
    },

    onInput: function(){
      var regex = new RegExp('^' + this.parseInput(), 'i');

      this._collection.updateFilter(function(model){
        return regex.test(model.get('name'));
      });
    },

    getAutocomplete: function(){
      var values = this._collection.pluck('name').sort(),
        partial = _.first(values) || '',
        last, len;

      if (values.length > 1) {
        len = partial.length;
        last = _.last(values);

        while (len > 0 && last.indexOf(partial) !== 0) {
          len -= 1;
          partial = partial.substring(0, len);
        }
      }

      return partial;
    },

    onKeyTab: function(){
      var value = this.getAutocomplete();

      if (value) {
        this.ui.input.val(value);
      }
    },

    onKeyEnter: function(model){
      if (!model) {
        model = this.collection.findWhere({name: this.parseInput()});
      }

      if (model) {
        this.triggerMethod('apply', model);
        this.ui.input.blur();
      }
    },

    onHotkey: function(){
      this.ui.input.focus();
    },

    onKeyEsc: function(){
      this.ui.input.blur();
    }
  });
});
