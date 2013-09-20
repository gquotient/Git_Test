define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  './util',

  'hbs!form/templates/dropdown',
  'hbs!form/templates/dropdownItem'
], function(
  $,
  _,
  Backbone,
  Marionette,

  util,

  dropdownTemplate,
  dropdownItemTemplate
){
  var views = {};

  views.DropdownItem = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: dropdownItemTemplate
    },

    templateHelpers: function(){
      return {
        attribute: this.model.get('display_name')
      };
    },

    triggers: {
      'mousedown a': 'select'
    }
  });

  views.Dropdown = Marionette.CompositeView.extend({

    constructor: function(){
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    },

    template: {
      type: 'handlebars',
      template: dropdownTemplate
    },

    className: 'dropdown',

    itemView: views.DropdownItem,
    itemViewContainer: 'ul'
  });

  views.InputDropdown = views.Dropdown.extend({

    constructor: function(options){
      this._collection = options.collection;

      options.collection = new util.Collection(options.collection, {
        comparator: options.comparator || 'display_name',
        close_with: this
      });

      views.Dropdown.prototype.constructor.call(this, options);

      this.$input = options.$input;
      this.current = this.getModel() || this.collection.first();

      this.delegateInputEvents({
        'input': 'updateFilter',
        'blur': 'close'
      });

      this.on('itemview:select', function(view){
        this.current = view.model;
        this.close();
      });

      this.on('render', function(){
        var pos = this.$input.position(),
          width = this.$input.innerWidth(),
          margin = parseInt(this.$input.css('margin-top'), 10);

        pos.left += (this.$input.outerWidth() - width) / 2;
        pos.top += this.$input.outerHeight() + margin + 1;

        this.$el.offset(pos).width(width);
      });

      _.bindAll(this, 'handleKeyEvent');
      $(document).on('keydown keypress', this.handleKeyEvent);
    },

    className: 'inputDropdown',

    keydownEvents: {
      9: 'key:tab',
      13: 'key:enter',
      27: 'key:esc',
      38: 'key:up',
      40: 'key:down'
    },

    handleKeyEvent: function(e){
      var value = (this[e.type + 'Events'] || {})[e.which];

      if (value) {
        e.preventDefault();
        this.triggerMethod(value);
      }
    },

    delegateInputEvents: function(events){
      _.each(events, function(method, name){
        name += '.schemaEvent' + this.cid;
        method = _.bind(_.isString(method) ? this[method] : method, this);
        this.$input.on(name, method);
      }, this);
    },

    undelegateInputEvents: function(){
      this.$input.off('.schemaEvent' + this.cid);
    },

    parseInput: function(){
      return this.$input.val();
    },

    getModel: function(){
      return this.collection.findWhere({display_name: this.parseInput()});
    },

    updateFilter: function(){
      var regex = new RegExp('^' + this.parseInput(), 'i');

      this.collection.updateFilter(function(model){
        return regex.test(model.get('display_name'));
      });
    },

    getAutocomplete: function(){
      var values = this.collection.pluck('display_name'),
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
        this.$input.val(value);
      }
    },

    onKeyEnter: function(){
      var model = this.getModel();

      if (model) {
        this.current = model;
        this.close();
      }
    },

    onKeyEsc: function(){
      this.close();
    },

    onClose: function(){
      this.undelegateInputEvents();
      $(document).off('keydown keypress', this.handleKeyEvent);

      this.$input.val(this.current.get('display_name')).blur();
    }
  });

  views.Admin = Marionette.ItemView.extend({
    constructor: function(){
      this.changed = {};

      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      this.listenTo(this.model, 'change', function(){
        this.updateValues(this.model.changed);
      });
    },

    tagName: 'form',

    dropdownView: views.InputDropdown,

    delegateEvents: function(events){

      // Handle the events object here.
      events = events || this.events;
      if (_.isFunction(events)) {
        events = events.call(this);
      }

      // Compile the schema object and add the schema events.
      this._schema = this.compileSchema();
      events = _.extend({}, events, this.schemaEvents());

      Marionette.View.prototype.delegateEvents.call(this, events);
    },

    compileSchema: function(){
      var schema = Marionette.getOption(this, 'schema'),
        modelSchema = this.model.constructor.schema || {};

      if (_.isFunction(schema)) {
        schema = schema.call(this);
      }

      return _.reduce(schema, function(memo, params, attr){
        memo[attr] = _.extend({
          el: '#' + attr,
          type: 'text',
          editable: true
        }, modelSchema[attr], params);

        return memo;
      }, {});
    },

    schemaEvents: function(){
      return _.reduce(this._schema, function(memo, params, attr){
        var parser = params.parse,
          validator = params.validate;

        memo['blur ' + params.el] = function(e){
          var $el = $(e.target), value;

          if ($el && $el.val) {
            value = $el.val().trim();

            if (parser) {
              value = parser.call(this, value);
            }

            if (validator && !validator.call(this, value)) {
              $el.addClass('invalid');

              if (params.error) {
                params.error.call(this, value);
              }
            } else {
              $el.removeClass('invalid');

              this.changed[attr] = value;

              if (params.success) {
                params.success.call(this, value);
              }
            }
          }
        };

        if (params.source) {
          memo['focus ' + params.el] = function(e){
            var $el = $(e.target);

            if ($el) {
              this.createDropdown($el, params.source);
            }
          };
        }

        return memo;
      }, {});
    },

    createDropdown: function($input, collection){
      var DropdownView = Marionette.getOption(this, 'dropdownView'), view;

      if (_.isFunction(collection)) {
        collection = collection.call(this);
      }

      view = new DropdownView({
        collection: collection,
        $input: $input
      });

      this.$el.append(view.render().el);
    },

    bindUIElements: function(){
      this.ui = {};

      Marionette.View.prototype.bindUIElements.apply(this, arguments);

      this.bindSchemaElements();
    },

    bindSchemaElements: function(){
      var editable = this.isEditable(),
        existing = !this.model.isNew(),
        tabIndex = 1;

      _.each(this._schema, function(params, attr){
        var $el = this.ui[attr] = this.$(params.el),
          disabled = !editable || (existing && !this.isEditable(attr));

        if ($el) {
          $el.prop('disabled', disabled);

          if (!disabled) {
            $el.attr('tabindex', params.tabIndex || tabIndex);
          }
        }

        tabIndex += 1;
      }, this);
    },

    isEditable: function(attr){
      var editable;

      if (attr) {
        editable = this._schema[attr].editable;
      } else {
        editable = Marionette.getOption(this, 'editable');
      }

      if (_.isFunction(editable)) {
        editable = editable.call(this);
      }

      return editable !== false;
    },

    updateValues: function(values){
      _.each(values, function(value, attr){
        var $el = this.ui[attr];

        if ($el && !$el.prop('disabled')) {
          $el.val(value).removeClass('.invalid');
        }
      }, this);
    },

    parseAll: function(){
      this.$el.find('input, textarea').blur();
    },

    hasInvalid: function(){
      return this.$el.find('.invalid').length > 0;
    },

    saveChanges: function(options, context){
      options = options || {};
      context = context || this;

      // Parse each field and return if any are invalid.
      this.parseAll();
      if (this.hasInvalid()) { return false; }

      if (options.before) {
        options.before.call(context);
      }

      return this.model.save(_.clone(this.changed), {
        success: function(){
          if (options.success) {
            options.success.call(context);
          }
        },
        complete: function(){
          if (options.after) {
            options.after.call(context);
          }
        }
      });
    }
  });

  return views;
});
