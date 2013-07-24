define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!project/templates/inputFieldItem'
], function(
  $,
  _,
  Backbone,
  Marionette,

  inputItemTemplate
){
  var

    Dropdown = Marionette.CollectionView.extend({
      tagName: 'ul',

      itemView: Marionette.ItemView.extend({
        tagName: 'li',
        template: {
          type: 'handlebars',
          template: inputItemTemplate
        },

        triggers: {
          'mousedown a': 'select'
        }
      }),

      renderPartial: function(regex){
        this.regex = regex;
        return this.render();
      },

      addItemView: function(model){
        if (!this.regex || this.regex.test(model.get('name'))) {
          Marionette.CollectionView.prototype.addItemView.apply(this, arguments);
        }
      }
    });

  return Marionette.View.extend({

    constructor: function(options){
      var args = Array.prototype.slice.apply(arguments);
      Marionette.View.prototype.constructor.apply(this, args);

      this.ui = {input: this.$('input')};
      this.placeholder = this.ui.input.val();

      this.dropdown = new Dropdown({collection: this.collection});

      this.listenTo(this.dropdown, 'itemview:select', function(view){
        this.triggerMethod('key:enter', view.model);
      });

      this.listenTo(Backbone, 'editor:keydown editor:keypress', this.handleKeyEvent);
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

      } else if (this.hotKey && e.which === this.hotKey) {

        if (!_.contains(['INPUT', 'TEXTAREA'], e.target.nodeName)) {
          e.preventDefault();
          this.triggerMethod('hotkey');
        }
      }
    },

    onFocus: function(){
      this.ui.input.val('');
      this.$el.append(this.dropdown.renderPartial().el);
      this.focused = true;
    },

    onBlur: function(){
      this.ui.input.val(this.placeholder);
      this.dropdown.close();
      this.focused = false;
    },

    parseInput: function(){
      return this.ui.input.val();
    },

    onInput: function(){
      this.dropdown.renderPartial( new RegExp('^' + this.parseInput(), 'i') );
    },

    getAutocomplete: function(){
      var values, partial, last, len;

      values = this.dropdown.children.map(function(view){
        return view.model.get('name');
      }).sort();

      partial = _.first(values) || '';

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
