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
  'hbs!issue/templates/alarmTemplateTableRow',
  'hbs!issue/templates/alarmTemplateEdit',
  'hbs!issue/templates/condition',
  'hbs!issue/templates/conditions'
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
  alarmTemplateTableRowTemplate,
  alarmTemplateEditTemplate,
  conditionTemplate,
  conditionsTemplate
){
  var Issue = { views: {} };

  Issue.Model = Backbone.Model.extend({
    url: function(){
      return '/api/alarms/' + this.collection.project.id + '/' + this.id;
    },
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
    },
    acknowledge: function(userId){
      // Ask user for an acknowledge comment
      var that = this;

      var comment = prompt('A comment is required to acknowledge this alarm.');

      if (comment && comment.length) {
        return $.ajax({
          url: '/api/alarms/' + this.collection.project.id + '/' + this.id,
          type: 'PUT',
          data: {
            user_info: userId,
            comment: comment
          }
        }).done(function(model){
          // Update model
          that.set(model);
        });
      }
    },
    resolve: function(){
      var that = this;

      var confirm = confirm('Are you sure you want to mark this alarm resolved?');

      if (confirm) {
        return $.ajax({
          url: '/api/alarms/resolve/' + this.collection.project.id + '/' + this.id,
          type: 'PUT'
        }).done(function(data){
          // Update model
          that.set(data.alarm);
        });
      }
    }
  });

  Issue.Collection = Backbone.Collection.extend({
    url: function(options){
      return '/api/alarms/' + this.project.id;
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
      'click .editConditions': 'editConditions'
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

  Issue.views.AlarmTemplateEdit = Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: alarmTemplateEditTemplate
    }
  });

  Issue.views.Condition = Marionette.ItemView.extend({
    tagName: 'li',
    className: 'condition',
    template: {
      type: 'handlebars',
      template: conditionTemplate
    }
  });

  Issue.views.Conditions = Marionette.CompositeView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: conditionsTemplate
    },
    itemView: Issue.views.Condition,
    itemViewContainer: 'ul.conditions'
  });

  return Issue;
});
