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

  function parseFactory(params){
    var parsers = {
      number: function(value){
        return parseFloat(value);
      },
      integer: function(value){
        return parsers.number(value);
      },
      length: function(value){
        var result = parsers.number(value);

        // If the value has no units or is in the proper units just return it.
        if (/(\d|m|meters?)$/.test(value)) { return result; }

        // Otherwise try to convert the value based on given units.
        if (/(cm|centimeters?)$/.test(value)) { return result / 100; }
        if (/(mm|millimeters?)$/.test(value)) { return result / 1000; }
        if (/(yd|yards?)$/.test(value)) { return result * 9144 / 10000; }
        if (/(ft|foot|feet)$/.test(value)) { return result * 3048 / 10000; }
        if (/(in|inch|inches)$/.test(value)) { return result * 254 / 10000; }

        // Anything else is invalid.
        return NaN;
      },
      power: function(value){
        var result = parsers.number(value);

        // If the value has no units or is in the proper units just return it.
        if (/(\d|w|watts?)$/.test(value)) { return result; }

        // Otherwise try to convert the value based on given units.
        if (/(kw|kilowatts?)$/.test(value)) { return result * 1000; }

        // Anything else is invalid.
        return NaN;
      }
    };

    return parsers[params.type];
  }

  function renderFactory(params){
    var renderers = {
      length: function(value){
        return _.compact([value, params.units]).join(' ');
      },
      power: function(value){
        return _.compact([value, params.units]).join(' ');
      }
    };

    return renderers[params.type];
  }

  function validateFactory(params){
    var validators = {
      text: function(value){
        return _.isString(value) && value !== '';
      },
      number: function(value){
        return _.isNumber(value) && !isNaN(value);
      },
      integer: function(value){
        return validators.number(value) && Math.floor(value) === value;
      },
      length: function(value){
        return validators.number(value);
      },
      power: function(value){
        return validators.number(value);
      }
    };

    return params.required && (validators[params.type] || validators.text);
  }

  views.DropdownItem = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: dropdownItemTemplate
    },

    templateHelpers: function(){
      return {
        attribute: this.model.get('name')
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
        comparator: options.comparator || 'name',
        close_with: this
      });

      views.Dropdown.prototype.constructor.call(this, options);

      this.$input = options.$input;
      this.current = this.getModel() || this.collection.first();

      this.delegateInputEvents({
        'input': 'updateFilter',
        'blur': 'close'
      });

      // When a dropdown item is clicked, capture it and close the view.
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
      return this.collection.findWhere({name: this.parseInput()});
    },

    updateFilter: function(){
      var regex = new RegExp('^' + this.parseInput(), 'i');

      this.collection.updateFilter(function(model){
        return regex.test(model.get('name'));
      });
    },

    getAutocomplete: function(){
      var values = this.collection.pluck('name'),
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

      // Capture the model and close the view on enter.
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

      // Replace the input text with the last known good model text.
      this.$input.val(this.current.get('name')).blur();
    }
  });

  views.Admin = Marionette.ItemView.extend({
    constructor: function(){
      this.changed = {};

      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      // Update the input fields and discard changed when the model changes.
      this.listenTo(this.model, 'change', function(model){
        this.changed = _.omit(this.changed, _.keys(model.changed));
        this.updateValues(model.changed);
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
      var viewSchema = Marionette.getOption(this, 'schema') || {},
        modelSchema = this.model.getSchema() || {},
        attrs;

      // Allow creating the view schema dynamically.
      if (_.isFunction(viewSchema)) {
        viewSchema = viewSchema.call(this);
      }

      // Create a combined list of schema attributes.
      attrs = _.union(_.keys(viewSchema), _.keys(modelSchema));

      // Compile a single schema object for this view.
      return _.reduce(attrs, function(memo, attr){
        var params = memo[attr] = {};

        // Combine the model and view schema.
        _.extend(params, modelSchema[attr], viewSchema[attr]);

        // Add default values as needed for the view.
        _.defaults(params, {
          name: util.capitalize(attr),
          el: '#' + attr,
          parse: parseFactory(params),
          render: renderFactory(params),
          validate: validateFactory(params)
        });

        return memo;
      }, {});
    },

    schemaEvents: function(){
      return _.reduce(this._schema, function(memo, params, attr){

        // Create listeners for each schema item that will wait for the user
        // to finish entering data then parse and validate the value.
        memo['blur ' + params.el] = function(e){
          var $el = $(e.target), value;

          if ($el && $el.val) {
            value = $el.val().trim();

            if (params.parse) {
              value = params.parse.call(this, value);
            }

            // If the value is invalid, mark the input and call an error
            // handler if present.
            if (params.validate && !params.validate.call(this, value)) {
              $el.addClass('invalid');

              if (params.error) {
                params.error.call(this, value);
              }

            // Otherwise capture the changed value, clear the input marker
            // and call a success handler if present.
            } else {
              $el.removeClass('invalid');

              this.changed[attr] = value;

              if (params.success) {
                params.success.call(this, value);
              }
            }
          }
        };

        // If the schema item has a set of predefined values then add a
        // dropdown with those values when the input gets focus.
        if (params.source) {
          memo['focus ' + params.el] = function(e){
            var $el = $(e.target);

            if ($el) {
              this.createDropdown($el, params.source);
            }
          };
        }

        return memo;
      }, {}, this);
    },

    createDropdown: function($input, collection){
      var DropdownView = Marionette.getOption(this, 'dropdownView'), view;

      // Allow creating the list of dropdown items dynamically.
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
      this.ui = this.ui || {};

      Marionette.ItemView.prototype.bindUIElements.apply(this, arguments);
      this.bindSchemaElements();
    },

    bindSchemaElements: function(){
      var editable = this.isEditable(),
        existing = !this.model.isNew(),
        tabIndex = 1;

      // After each render, capture the element for each schema item. Also
      // disable the input if not editable or set it's tab order.
      _.each(this._schema, function(params, attr){
        var $el = this.ui[attr] = this.$(params.el),
          disabled = !editable || (existing && !this.isEditable(attr));

        if ($el) {
          $el.prop('disabled', disabled);

          if (!disabled && !params.tabSkip) {
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

    // Overwritten to apply schema rendering to the values.
    serializeData: function(){
      var data = _.extend({}, this.model.attributes, this.changed);

      _.each(data, function(value, attr){
        data[attr] = this.renderValue(attr, value);
      }, this);

      return data;
    },

    // Overwritten to pass values to the template helper.
    mixinTemplateHelpers: function(target){
      var templateHelpers = Marionette.getOption(this, 'templateHelpers');

      target = target || {};

      if (_.isFunction(templateHelpers)) {
        templateHelpers = templateHelpers.call(this, target);
      }

      return _.extend(target, templateHelpers);
    },

    updateValues: function(values){
      _.each(values, function(value, attr){
        var $el = this.ui[attr];

        if ($el && !$el.prop('disabled')) {
          $el.val(this.renderValue(attr, value)).removeClass('invalid');
        }
      }, this);
    },

    renderValue: function(attr, value){
      var params = this._schema[attr] || {};

      if (params.render) {
        value = params.render.call(this, value);
      }

      return value;
    },

    // This causes the parser and validator to be run on every input and
    // textarea field.
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
