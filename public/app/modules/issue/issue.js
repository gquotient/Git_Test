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
    url: '/api/issues',
    parse: function(data){
      console.log(data);
      return data;
    }
  });

  Issue.views.TableRow = Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: tableRowTemplate
    },
    render: function(){
      this.setElement(this.template.template(this.model.attributes));
    }
  });

  Issue.views.Table = Marionette.CompositeView.extend({
    template: {
      type: 'handlebars',
      template: tableTemplate
    },
    itemViewContainer: 'tbody',
    itemView: Issue.views.TableRow,
    initialize: function(){
      console.log(this);
    }
  });

  return Issue;
});