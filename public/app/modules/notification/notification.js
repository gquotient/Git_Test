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
  var Notification = { views: {} };

  Notification.Model = Backbone.Model.extend({});

  Notification.Collection = Backbone.Collection.extend({
    model: Notification.Model
  });

  Notification.views.TableRow = Marionette.ItemView.extend({
    tagName: 'tr',
    template: {
      type: 'handlebars',
      template: tableRowTemplate
    }
  });

  Notification.views.Table = Marionette.CompositeView.extend({
    template: {
      type: 'handlebars',
      template: tableTemplate
    },
    itemViewContainer: 'tbody',
    itemView: Notification.views.TableRow
  });

  return Notification;
});
