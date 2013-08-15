define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'navigation',

  'hbs!issue/templates/table',
  'hbs!issue/templates/tableRow',
  'hbs!issue/templates/tableRowEmpty',
  'hbs!issue/templates/navigationItem',
  'hbs!issue/templates/navigationList'
],
function(
  $,
  _,
  Backbone,
  Marionette,

  Navigation,

  tableTemplate,
  tableRowTemplate,
  tableRowEmptyTemplate,
  navigationItemTemplate,
  navigationListTemplate
){
  var Issue = { views: {} };

  Issue.Model = Backbone.Model.extend({
    idAttribute: 'uid'
  });

  Issue.Collection = Backbone.Collection.extend({
    model: Issue.Model,
    parse: function(data){
      return data.alarms;
    },
    getSeverity: function(){
      var statusLevels = ['OK', 'Warning', 'Alert'],
          status = 'OK',
          statusValue = 0;

      this.each(function(issue){
        var priority = issue.get('active_conditions')[0].priority;

        if (_.indexOf(statusLevels, priority) > _.indexOf(statusLevels, status)) {
          status = priority;
          statusValue = _.indexOf(statusLevels, priority);
        }
      });

      return {
        status: status,
        statusValue: statusValue
      };
    },
    initialize: function(models, options){
      this.url = '/api/alarms/active/' + options.projectId;
    }
  });

  Issue.views.TableRow = Marionette.ItemView.extend({
    tagName: 'tr',
    template: {
      type: 'handlebars',
      template: tableRowTemplate
    },
    events: {
      'click': function(){
        Backbone.trigger('click:issue', this.model);
      }
    }
  });

  Issue.views.Table = Marionette.CompositeView.extend({
    attributes: {
      class: 'basic'
    },
    template: {
      type: 'handlebars',
      template: tableTemplate
    },
    itemViewContainer: 'tbody',
    itemView: Issue.views.TableRow,
    emptyView: Marionette.ItemView.extend({
      tagName: 'tr',
      template: {
        type: 'handlebars',
        template: tableRowEmptyTemplate
      }
    }),
    events: {
      'click .viewAll': function(event){
        event.preventDefault();
        Backbone.trigger('click:issue', 'all');
      }
    }
  });

  /* The item view is the view for the individual portfolios in the navigation. */
  Issue.views.NavigationItem = Navigation.views.ListItem.extend({
    template: {
      type: 'handlebars',
      template: navigationItemTemplate
    },
    events: {
      'click': function(){
        Backbone.trigger('click:issue', this.model);
      }
    }
  });

  /* This composite view is the wrapper view for the list of portfolios.
     It handles nesting the list while allowing for the navigation header. */
  Issue.views.NavigationListView = Navigation.views.List.extend({
    template: {
      type: 'handlebars',
      template: navigationListTemplate
    },

    // Tell the composite view which view to use as for each portfolio.
    itemView: Issue.views.NavigationItem
  });

  return Issue;
});