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
      })
    });

  return Marionette.ItemView.extend({
    ui: {
      'input': 'input'
    },

    triggers: {
      'focus input': 'focus',
      'blur input': 'blur',
      'input input': 'input',
      'click button': 'apply'
    },

    constructor: function(options){
      this.project = options.project;

      var args = Array.prototype.slice.apply(arguments);
      Marionette.ItemView.prototype.constructor.apply(this, args);

      if (!this.collection) { this.collection = new Backbone.Collection(); }
      this.collection.comparator = 'name';
      this.dropdown = new Dropdown({collection: this.collection});

      // Update the dropdown when the collection changes.
      this.listenTo(this.collection, 'add remove reset', this.renderDropdown);

      // Listen for device selection events and store locally.
      this.listenTo(Backbone, 'editor:selection', function(selection){
        this.selection = selection.length > 0 ? selection : null;
        this.triggerMethod('change:selection', selection);
      });

      if (this.hotKey) {
        this.listenTo(Backbone, 'editor:keypress', function(e){

          // Focus the input field on hotkey.
          if (e.which === this.hotKey && e.target.nodeName !== 'INPUT') {
            e.preventDefault();
            this.ui.input.focus();
          }
        });
      }

      this.listenTo(Backbone, 'editor:keydown', function(e){
        if (!this.focused) { return; }

        // Trigger autocomplete on tab key.
        if (e.which === 9) {
          e.preventDefault();
          this.triggerMethod('autocomplete', this.ui.input.val());

        // Trigger apply on enter key.
        } else if (e.which === 13) {
          e.preventDefault();
          this.triggerMethod('apply', this.ui.input.val());

        // Blur the input field on esc key.
        } else if (e.which === 27) {
          this.ui.input.blur();
        }
      });
    },

    onRender: function(){
      this.placeholder = this.ui.input.val();
    },

    onFocus: function(){
      this.focused = true;
      this.ui.input.val('');
      this.renderDropdown();

      this.filterCollection();
    },

    onBlur: function(){
      this.focused = false;
      this.ui.input.val(this.placeholder);
      this.dropdown.close();
    },

    onInput: function(){
      this.filterCollection( new RegExp('^' + this.parseInput(), 'i') );
    },

    onChangeSelection: function(){
      this.filterCollection();
    },

    onAutocomplete: function(){
      var value = this.getAutocomplete();

      if (value) {
        this.ui.input.val(value);
      }
    },

    filterCollection: function(){},

    parseInput: function(){
      return this.ui.input.val();
    },

    getAutocomplete: function(){
      var model = this.collection.first();

      return model && model.get('name');
    },

    renderDropdown: function(){
      this.dropdown.close();

      if (this.focused && this.collection.length > 0) {
        this.$el.append(this.dropdown.render().el);
      }
    }
  });
});
