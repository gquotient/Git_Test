define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!issue/templates/table',
  'hbs!issue/templates/tableRow',
  'hbs!issue/templates/navigationItem',
  'hbs!issue/templates/navigationList'
],
function(
  $,
  _,
  Backbone,
  Marionette,

  tableTemplate,
  tableRowTemplate,
  navigationItemTemplate,
  navigationListTemplate
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
    tagName: 'table',
    attributes: {
      class: 'basic'
    },
    template: {
      type: 'handlebars',
      template: tableTemplate
    },
    itemViewContainer: 'tbody',
    itemView: Issue.views.TableRow,
    events: {
      'click .viewAll': function(event){
        event.preventDefault();
        Backbone.trigger('click:issue', 'all');
      }
    }
  });

  /* The item view is the view for the individual portfolios in the navigation. */
  Issue.views.NavigationItem = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: navigationItemTemplate
    },
    attributes: {
      class: 'nav-item'
    },
    events: {
      'click': function(){
        Backbone.trigger('click:issue', this.model);
      }
    },
    initialize: function(options) {
      this.$el.attr('id', options.model.id);
    }
  });

  /* This composite view is the wrapper view for the list of portfolios.
     It handles nesting the list while allowing for the navigation header. */
  Issue.views.NavigationListView = Marionette.CompositeView.extend({
    tagName: 'div',
    attributes: {
      class: 'issues'
    },
    template: {
      type: 'handlebars',
      template: navigationListTemplate
    },

    itemViewContainer: 'ul',

    // Tell the composite view which view to use as for each portfolio.
    itemView: Issue.views.NavigationItem
  });

  return Issue;
});