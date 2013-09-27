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
    addItem: function(){
      console.log('add item', arguments);
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
    itemView: Notification.views.DropDownItem
  });

  return Notification;
});
