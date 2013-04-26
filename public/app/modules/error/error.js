define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette'
],
function(
  $,
  _,
  Backbone,
  Marionette
){
  var Error = { views: {} };

  Error.model = Backbone.Model.extend({});

  Error.views.floating = Backbone.View.extend({
    options: {
      message: 'Unknown error',
      closable: false,
      autoHide: true,
      hideTime: 3000,
      classes: '',
      css: {
        position: 'absolute',
        top: 0,
        margin: 12,
        'z-index': 500
      }
    },
    attributes: {
      class: 'message'
    },
    render: function(){
      this.$el.css(this.options.css);
      this.$el.html(this.template());
    },
    hide: function(){
      var that = this;

      this.$el.delay(this.options.hideTime).fadeOut(function(){
        that.remove();
      });
    },
    initialize: function(options){
      this.options = _.extend(this.options, options);

      this.template = _.template(this.options.message);

      this.render();

      if (this.options.classes.length) {
        this.$el.addClass(this.options.classes);
      }

      if (this.options.autoHide) {
        this.hide();
      }
    }
  });

  return Error;
});