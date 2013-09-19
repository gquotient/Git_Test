define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette'
], function(
  $,
  _,
  Backbone,
  Marionette
){
  var views = {};

  views.Admin = Marionette.ItemView.extend({
    constructor: function(){
      this.changed = {};

      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      this.listenTo(this.model, 'change', function(){
        this.updateValues(this.model.changed);
      });
    },

    tagName: 'form',

    delegateEvents: function(events){

      // Handle the events object here.
      events = events || this.events;
      if (_.isFunction(events)) {
        events = events.call(this);
      }

      // Compile the schema object and add the schema events.
      this._compileSchema();
      events = _.extend({}, events, this.schemaEvents);

      Marionette.View.prototype.delegateEvents.call(this, events);
    },

    _compileSchema: function(){
      var schema = Marionette.getOption(this, 'schema'),
        modelSchema = this.model.schema || {},
        handler;

      if (_.isFunction(schema)) {
        schema = schema.call(this);
      }

      this.schemaEvents = {};
      this._schema = {};

      _.each(schema, function(params, attr){
        params = _.extend({}, modelSchema[attr], params);

        handler = this.createSchemaHandler(attr, params);
        this.schemaEvents['blur.schema ' + params.el] = handler;

        this._schema[attr] = params;
      }, this);
    },

    createSchemaHandler: function(attr, options){
      var parser = options.parse,
        validator = options.validate;

      return function(){
        var $el = this.ui[attr], value;

        if ($el && $el.val) {
          value = $el.val().trim();

          if (parser) {
            value = parser.call(this, value);
          }

          if (validator && !validator.call(this, value)) {
            $el.addClass('invalid');

            if (options.error) {
              options.error.call(this, value);
            }
          } else {
            $el.removeClass('invalid');

            this.changed[attr] = value;

            if (options.success) {
              options.success.call(this, value);
            }
          }
        }
      };
    },

    bindUIElements: function(){
      this.ui = {};

      Marionette.View.prototype.bindUIElements.apply(this, arguments);

      this.bindSchemaElements();
    },

    bindSchemaElements: function(){
      var editable = this.isEditable(),
        existing = !this.model.isNew();

      _.each(this._schema, function(params, attr){
        var $el = this.ui[attr] = this.$(params.el),
          disabled = !editable || (existing && !this.isEditable(attr));

        if ($el) {
          $el.prop('disabled', disabled);
        }
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
