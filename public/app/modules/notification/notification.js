define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!notification/templates/dropDown',
  'hbs!notification/templates/dropDownItem'
],
function(
  $,
  _,
  Backbone,
  Marionette,

  dropDownTemplate,
  dropDownItemTemplate
){
  var Notification = { views: {} };

  Notification.Model = Backbone.Model.extend({});

  Notification.Collection = Backbone.Collection.extend({
    model: Notification.Model,
    addItem: function(models){
      console.log('add item', arguments);
      this.set(models);
    },
    initialize: function(options){
      this.listenTo(Backbone, 'notification', this.addItem);
    }
  });

  Notification.views.DropDownItem = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: dropDownItemTemplate
    },
    onRender: function(){
      if (this.model.get('acked')) {
        this.$el.addClass('acknowledged');
      }
    }
  });

  Notification.views.DropDown = Marionette.CompositeView.extend({
    className: 'notificationDropDown',
    template: {
      type: 'handlebars',
      template: dropDownTemplate
    },
    templateHelpers: function(){
      return {
        count: this.collection.length
      };
    },
    ui: {
      indicator: '.indicator'
    },
    itemView: Notification.views.DropDownItem,
    itemViewContainer: 'ul',
    collectionEvents: {
      'change reset set add': function(){
        this.ui.indicator.text(this.collection.length);
      }
    }
  });

  return Notification;
});
