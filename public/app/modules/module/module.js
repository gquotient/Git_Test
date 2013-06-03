define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!module/templates/table',
  'hbs!module/templates/tableRow',
],
function(
  $,
  _,
  Backbone,
  Marionette,

  tableTemplate,
  tableRowTemplate
){
  var Module = { views: {} };

  Module.model = Backbone.Model.extend({});

  Module.views.floating = Marionette.itemView.extend({});

  Module.views.TableRow = Marionette.ItemView.extend({
    tagName: 'tr',
    template: {
      type: 'handlebars',
      template: tableRowTemplate
    }
  });

  Module.views.Table = Marionette.CompositeView.extend({
    template: {
      type: 'handlebars',
      template: tableTemplate
    },
    itemViewContainer: 'tbody',
    itemView: Module.views.TableRow
  });

  return Module;
});