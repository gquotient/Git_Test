define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.virtualCollection',

  'navigation',
  'walltime',

  'hbs!issue/templates/table',
  'hbs!issue/templates/tableRow',
  'hbs!issue/templates/tableRowEmpty',
  'hbs!issue/templates/navigationItem',
  'hbs!issue/templates/navigationList',
  'hbs!issue/templates/alarmTemplateTable',
  'hbs!issue/templates/alarmTemplateTableRow'
],
function(
  $,
  _,
  Backbone,
  Marionette,
  VirtualCollection,

  Navigation,
  WallTime,

  tableTemplate,
  tableRowTemplate,
  tableRowEmptyTemplate,
  navigationItemTemplate,
  navigationListTemplate,
  alarmTemplateTableTemplate,
  alarmTemplateTableRowTemplate
){
  var Issue = { views: {} };

  Issue.Model = Backbone.Model.extend({
    idAttribute: 'uid',
    getLocalDate: function(){
      var timezone = this.collection.project.get('timezone'),
        walltime = WallTime.UTCToWallTime(new Date(), timezone),
        offsetHours = (walltime.offset.negative) ? -walltime.offset.hours : walltime.offset.hours,
        offset = offsetHours * 60 * 60 * 1000;

      return {
        start: (this.get('fault_start') * 1000) + offset,
        stop: (this.get('fault_stop') * 1000) + offset
      };
    }
  });

  Issue.Collection = Backbone.Collection.extend({
    url: function(options){
      return '/api/alarms/active/' + this.project.id;
    },
    model: Issue.Model,
    initialize: function(models, options){
      this.project = options.project;
    },
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
    className: 'basic',
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
    },
    initialize: function(options){
      this.collection = new Backbone.VirtualCollection(options.collection, {
        filter: options.filter,
        close_with: this
      });
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

  Issue.TemplateCollection = Backbone.Collection.extend({
    url: function(){
      return '/api/project_alarms/' + this.project.id;
    },
    initialize: function(models, options){
      this.project = options.project;
    }
  });

  Issue.views.AlarmTemplateTableRow = Marionette.ItemView.extend({
    tagName: 'tr',
    template: {
      type: 'handlebars',
      template: alarmTemplateTableRowTemplate
    },
    triggers: {
      'click .addCondition': 'addCondition'
    }
  });

  Issue.views.AlarmTemplateTable = Marionette.CompositeView.extend({
    tagName: 'table',
    template: {
      type: 'handlebars',
      template: alarmTemplateTableTemplate
    },
    className: 'basic',
    itemViewContainer: 'tbody',
    itemView: Issue.views.AlarmTemplateTableRow,
    emptyView: Marionette.ItemView.extend({template: _.template('<span class="loadingIndicator"></span>')})
  });

  return Issue;
});
