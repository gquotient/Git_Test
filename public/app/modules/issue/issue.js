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

  'hbs!issue/templates/alarmSingleEdit',
  'hbs!issue/templates/condition',
  'hbs!issue/templates/conditionOnOff',
  'hbs!issue/templates/conditionIrradianceOutOfRange',
  'hbs!issue/templates/conditionTemperatureOutOfRange',
  'hbs!issue/templates/conditionLowInverterPower'
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

  alarmSingleEditTemplate,
  conditionTemplate,
  conditionOnOffTemplate,
  conditionIrradianceOutOfRangeTemplate,
  conditionTemperatureOutOfRangeTemplate,
  conditionLowInverterPowerTemplate
){
  var Issue = { views: {} };

  Issue.Model = Backbone.Model.extend({
    url: function(){
      return '/api/alarms/active/' + this.collection.project.id + '/' + this.id;
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

      var comment = window.prompt('A comment is required to acknowledge this alarm.');

      if (comment && comment.length) {
        return this.save({
          user_info: userId,
          comment: comment,
          success: function(model){
            that.set(model);
          }
        });
      }
    },
    resolve: function(){
      var that = this;

      var confirm = window.confirm('Are you sure you want to mark this alarm resolved?');

      if (confirm) {
        return $.ajax({
          url: '/api/alarms/active/resolve/' + this.collection.project.id + '/' + this.id,
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

  Issue.views.NavigationListView = Navigation.views.List.extend({
    template: {
      type: 'handlebars',
      template: navigationListTemplate
    },
    itemView: Issue.views.NavigationItem
  });

  // Alarm template editing
  // NOTE - This may belong in it's own module

  Issue.AlarmTemplateModel = Backbone.Model.extend({
    url:'/api/alarms'
  });

  Issue.TemplateCollection = Backbone.Collection.extend({
    url: function(){
      return '/api/alarms/templates/' + this.project.id;
    },
    model: Issue.AlarmTemplateModel,
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
    ui: {
      enableButton: '.enable'
    },
    triggers: {
      'click .enable': 'enable',
      'click .editConditions': 'editConditions'
    },
    onEnable: function(){
      var that = this;

      this.ui.enableButton.addClass('loading-right');

      this.model.save({
        project_label: this.model.collection.project.id,
        enabled: true
      },
      {
        wait: true,
        complete: function(){
          that.ui.enableButton.removeClass('loading-right');
          that.render();
        }
      });
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

  Issue.ConditionModel = Backbone.Model.extend({
    url: '/api/alarms/conditions',
    idAttribute: 'condition_id',
    defaults: {
      notification_secs: 0,
      enabled: false
    }
  });

  Issue.ConditionCollection = Backbone.Collection.extend({
    url: '/api/alarms/conditions',
    model: Issue.ConditionModel,
    initialize: function(models, options){
      this.alarm = options.alarm;
    }
  });

  Issue.views.Condition = Marionette.ItemView.extend({
    tagName: 'li',
    className: 'condition',
    getTemplate: function(){
      // Store available templates
      var templates = {
        'Inverter Low Power': conditionLowInverterPowerTemplate,
        'Communications Failure': conditionOnOffTemplate,
        'Irradiance Out of Range': conditionIrradianceOutOfRangeTemplate,
        'Temperature Out of Range': conditionTemperatureOutOfRangeTemplate
      },
      // This will be returned
      template = {
        type: 'handlebars'
      };

      // Set the template conditionally based on alarm type
      template.template = templates[this.model.collection.alarm.get('alarm_type')];

      // Return the template
      return template;
    },
    ui: {
      enabled: 'input[name="enabled"]',
      enabledCheck: '.enabledCheck'
    },
    triggers: {
      'click .remove': 'remove'
    },
    events: {
      'click .enabledCheck': 'enabledCheck'
    },
    enabledCheck: function(){
      // Checkboxes are annoying, so set the value of a hidden input
      this.ui.enabled.val(this.ui.enabledCheck.is(':checked'));
    },
    onRemove: function(){
      this.model.destroy();
    },
    templateHelpers: function(){
      return {
        teams: this.options.teams
      };
    }
  });

  Issue.views.AlarmSingleEdit = Marionette.CompositeView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: alarmSingleEditTemplate
    },
    itemView: Issue.views.Condition,
    itemViewContainer: '.conditions',
    itemViewOptions: function(){
      return {
        teams: this.options.user.get('teams')
      };
    },
    ui: {
      message: '.message',
      saveButton: '.save'
    },
    triggers: {
      'click .addCondition': 'addCondition',
      'click .cancel': 'cancel',
      'click .save': 'save'
    },
    initialize: function(options){
      this.collection = new Issue.ConditionCollection(options.model.get('conditions'), {alarm: this.model});
    },
    updateMessage: function(message, type) {
      // Remove existing status classes
      this.ui.message.removeClass('error warning ok');

      if (type) {
        this.ui.message.addClass(type);
      }

      if (message) {
        this.ui.message.text(message);
        this.ui.message.fadeIn();
      } else {
        this.ui.message.fadeOut();
      }
    },
    onAddCondition: function(){
      // Add a new model based on defaults for this alarm type
      this.collection.add(_.extend({}, this.model.get('defaults')));
    },
    onCancel: function(){
      // Navigate back to parent project
      Backbone.history.navigate('/admin/alarms/' + this.options.project.id, true);
    },
    onSave: function(){
      var that = this;

      // Add loading spinner to save button
      this.ui.saveButton.addClass('loading-right');

      // When alarm is ready submit conditions
      that.children.each(function(conditionView){
        var condition = conditionView.model,
          newProperties = {
            alarm_id: that.model.id,
            enabled: conditionView.$el.find('[name="enabled"]').val(),
            priority: conditionView.$el.find('[name="severity"]').val(),
            team_label: conditionView.$el.find('[name="team"]').val(),
            org_label: that.options.user.get('org_label')
          };

        if (conditionView.$el.find('[name="operator"]').val()) {
          newProperties.comparator = conditionView.$el.find('[name="operator"]').val();
          newProperties.threshold = conditionView.$el.find('[name="value"]').val();
        }


        // Save the model
        // NOTE - I don't like this, the save should be on the view but the statusing stuff lives up here
        // so, it works for now
        condition.save(newProperties,
        {
          wait: true,
          complete: function(){
            // This will make the spinner go away on the first save which is sub-optimal
            // if multiple models are being saved
            that.ui.saveButton.removeClass('loading-right');
          },
          success: function(){
            that.updateMessage('Conditions saved.');
          },
          error: function(){
            that.updateMessage('Something went wrong, try saving again.', 'error');
          }
        });
      });
    }
  });

  return Issue;
});
