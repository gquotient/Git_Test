define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.virtualCollection',

  'form',

  'hbs!project/templates/dropdown',
  'hbs!project/templates/dropdownItem'
], function(
  $,
  _,
  Backbone,
  Marionette,
  VirtualCollection,

  Form,

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

      templateHelpers: function(){
        return {
          attribute: this.model.get(this.options.attribute)
        };
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
          applyAll: this.options.applyAll && this.collection.length > 1
        };
      },

      itemView: DropdownItemView,
      itemViewContainer: 'ul',

      itemViewOptions: function(){
        return {
          attribute: this.options.attribute
        };
      },

      className: 'editorDropdown',

      triggers: {
        'mousedown a.all': 'select:all'
      },

      // Overwritten to render everything on reset, filter and sort.
      _initialEvents: function(){
        if (this.collection) {
          this.listenTo(this.collection, 'add', this.addChildView, this);
          this.listenTo(this.collection, 'remove', this.removeItemView, this);
          this.listenTo(this.collection, 'reset filter sort', this.render, this);
        }
      },

      // Overwritten to repect the collection order when adding children.
      appendHtml: function(collectionView, itemView, index){
        var $container = this.getItemViewContainer(collectionView),
          children = $container.children();

        if (children.size() <= index) {
          $container.append(itemView.el);
        } else {
          children.eq(index).before(itemView.el);
        }
      }
    });


  return Marionette.View.extend({

    constructor: function(options){
      options.collection = options.collection || new Backbone.Collection();
      Marionette.View.prototype.constructor.call(this, options);

      this._collection = new Form.util.Collection(this.collection, {
        comparator: options.comparator,
        close_with: this
      });

      this.attribute = options.attribute || 'name';

      this.ui = {input: this.$('input')};
      this.placeholder = this.ui.input.val();

      this.dropdown = new DropdownView({
        collection: this._collection,
        applyAll: options.applyAll,
        attribute: this.attribute
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
      var regex = new RegExp('^' + this.parseInput(), 'i'),
        attribute = this.attribute;

      this._collection.updateFilter(function(model){
        return regex.test(model.get(attribute));
      });
    },

    getAutocomplete: function(){
      var values = this._collection.pluck(this.attribute).sort(),
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
      var criteria = {};

      if (!model) {
        criteria[this.attribute] = this.parseInput();
        model = this.collection.findWhere(criteria);
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
