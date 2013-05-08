define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!project/templates/editorSelectItem'
], function(
  $,
  _,
  Backbone,
  Marionette,

  selectItemTemplate
){
  var
    Dropdown = Marionette.CollectionView.extend({
      tagName: 'ul',

      itemView: Marionette.ItemView.extend({
        tagName: 'li',
        template: {
          type: 'handlebars',
          template: selectItemTemplate
        }
      })
    });

  return Marionette.ItemView.extend({
    constructor: function(){
      var args = Array.prototype.slice.apply(arguments);
      Marionette.ItemView.prototype.constructor.apply(this, args);

      if (!this.collection) {
        this.collection = new Backbone.Collection();
      }
      this.dropdown = new Dropdown({collection: this.collection});

      if (this.hotKey) {
        this.listenTo(Backbone, 'editor:keypress', function(e){
          // Focus the input field when the hotkey is pressed.
          if (e.which === this.hotKey && e.target.nodeName !== 'INPUT') {
            this.$input.focus();
            e.preventDefault();
          }
        });

        this.listenTo(Backbone, 'editor:keydown', function(e){
          // Blur the input field when esc is pressed.
          if (e.which === 27) { this.$input.blur(); }
        });
      }
    },

    triggers: {
      'focus input': 'focus',
      'blur input': 'blur',
      'click button': 'click'
    },

    onRender: function(){
      this.$input = this.$('input');
      this.placeholder = this.$input.val();
    },

    onFocus: function(){
      this.$input.val('');
      if (this.collection.length > 0) {
        this.dropdown.close();
        this.$el.append(this.dropdown.render().el);
      }
    },

    onBlur: function(){
      this.$input.val(this.placeholder);
      this.dropdown.close();
    }
  });
});
