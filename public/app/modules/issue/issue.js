define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!issue/templates/table',
  'hbs!issue/templates/tableRow'
],
function(
  $,
  _,
  Backbone,
  Marionette,

  tableTemplate,
  tableRowTemplate
){
  var Issue = { views: {} };

  Issue.Model = Backbone.Model.extend({
    url: '/api/issues'
  });

  Issue.Collection = Backbone.Collection.extend({
    url: '/api/issues'
  });

  Issue.views.TableRow = Marionette.ItemView.extend({
    tagName: 'tr',
    template: {
      type: 'handlebars',
      template: tableRowTemplate
    }
  });

  Issue.views.Table = Marionette.CompositeView.extend({
    template: {
      type: 'handlebars',
      template: tableTemplate
    },
    itemViewContainer: 'tbody',
    itemView: Issue.views.TableRow
  });

  return Issue;
});