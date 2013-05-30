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
      'input input': 'input',
      'blur input': 'blur',
      'click button': 'apply'
    },

    constructor: function(options){
      this.project = options.project;

      var args = Array.prototype.slice.apply(arguments);
      Marionette.ItemView.prototype.constructor.apply(this, args);

      if (!this.collection) { this.collection = new Backbone.Collection(); }
      this.collection.comparator = 'name';
      this.dropdown = new Dropdown({collection: this.collection});

      // Store the placeholder text when the template is rendered.
      this.listenTo(this, 'render', function(){
        this.placeholder = this.ui.input.val();
      });

      // Show the dropdown when the input box has focus.
      this.listenTo(this, 'focus', function(){
        this.focused = true;
        this.ui.input.val('');
        this.renderDropdown();
      });

      // Hide the dropdown when the input box loses focus.
      this.listenTo(this, 'blur', function(){
        this.focused = false;
        this.ui.input.val(this.placeholder);
        this.dropdown.close();
      });

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

    onFocus: function(){
      this.filterCollection();
    },

    onInput: function(){
      var partial = this.parseInput().name;
      this.filterCollection( new RegExp('^' + partial, 'i') );
    },

    onChangeSelection: function(){
      this.filterCollection();
    },

    onAutocomplete: function(){
      if (this.collection.length > 0) {
        this.ui.input.val(this.collection.first().get('name'));
      }
    },

    filterCollection: function(){},

    parseInput: function(){
      var input = this.ui.input.val(),
        match = /^([^x]*)x(\d+)$/.exec(input);

      return {
        input: input,
        name: match ? match[1] : input,
        times: _.max([1, match && parseInt(match[2], 10)])
      };
    },

    renderDropdown: function(){
      this.dropdown.close();

      if (this.focused && this.collection.length > 0) {
        this.$el.append(this.dropdown.render().el);
      }
    }
  });
});
