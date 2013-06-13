define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!project/templates/editorInputItem'
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

      this.listenTo(Backbone, 'editor:keydown editor:keypress', this.handleKeyEvent);
    },

    triggers: {
      'focus input': 'focus',
      'blur input': 'blur',
      'input input': 'input',
      'click button': 'apply'
    },

    keydownEvents: {
      9: 'key:tab',
      27: 'key:esc',
      38: 'key:up',
      40: 'key:down',
      13: 'apply'
    },

    handleKeyEvent: function(e){
      var value = (this[e.type + 'Events'] || {})[e.which];

      if (value && this.focused) {
        e.preventDefault();
        this.triggerMethod(value, e);

      } else if (this.hotKey && e.which === this.hotKey && e.target.nodeName !== 'INPUT') {
        e.preventDefault();
        this.triggerMethod('hotkey', e);
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
      var view = this.dropdown.children.first();

      return view && view.model.get('name');
    },

    onKeyTab: function(){
      var value = this.getAutocomplete();

      if (value) {
        this.ui.input.val(value);
      }
    },

    onHotkey: function(e){
      this.ui.input.focus();
    },

    onKeyEsc: function(e){
      this.ui.input.blur();
    }
  });
});
