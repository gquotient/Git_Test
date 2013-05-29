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
  var Message = { views: {} };

  Message.model = Backbone.Model.extend({});

  Message.views.floating = Backbone.View.extend({
    options: {
      message: 'Unknown Message',
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

  Message.views.notificationBanner = Marionette.ItemView.extend({
    options: {
      content: 'This is a notification! <div class="actions"><button class="button sml close">Dismiss</button></div>'
    },
    attributes: {
      class: 'notification'
    },
    render: function(){
      this.$el.html(this.options.content);
    },
    events: {
      'click button.close': function(event){
        event.preventDefault();
        this.close();
        this.trigger('close');
      }
    }
  });

  return Message;
});