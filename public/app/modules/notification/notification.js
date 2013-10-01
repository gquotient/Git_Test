define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'issue',

  'hbs!notification/templates/dropDown',
  'hbs!notification/templates/dropDownItem'
],
function(
  $,
  _,
  Backbone,
  Marionette,

  Issue,

  dropDownTemplate,
  dropDownItemTemplate
){
  var Notification = { views: {} };

  Notification.Collection = Backbone.Collection.extend({
    model: Issue.Model,
    addItem: function(models){
      var unacknowledgedAlarms = _.filter(models, function(model){
        return !model.acked;
      });

      this.set(unacknowledgedAlarms);
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
    },
    templateHelpers: function(){
      return {
        project: this.options.project.toJSON()
      };
    },
    triggers: {
      'click .view': 'view',
      'click .acknowledge': 'acknowledge',
      'click .resolve': 'resolve'
    },
    onView: function(){
      Backbone.history.navigate('/project/' + this.model.get('project_label') + '/issues/' + this.model.id, true);
    },
    onResolve: function(){
      this.model.resolve();
    },
    onAcknowledge: function(){
      var that = this;

      this.model.acknowledge(this.options.user.get('email')).done(function(){
        that.model.collection.remove(that.model);
      });
    },
    onRender: function(){
      if (this.model.get('acked')) {
        this.$el.addClass('acknowledged');
      }
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
    ui: {
      indicator: '.indicator'
    },
    triggers: {
      'click .acknowledgeAll': 'acknowledgeAll'
    },
    itemView: Notification.views.DropDownItem,
    itemViewContainer: '.notifications > ul',
    emptyView: Marionette.ItemView.extend({
      tagName: 'li',
      className: 'empty',
      template: _.template('No notifications')
    }),
    itemViewOptions: function(model){
      return {
        project: this.options.projects.get(model.get('project_label')),
        user: this.options.user
      };
    },
    updateCount: function(){
      this.ui.indicator.text(this.collection.length);
    },
    modelEvents: {
      'change': 'render'
    },
    collectionEvents: {
      'add remove reset': 'updateCount'
    },
    onAcknowledgeAll: function(){
      this.children.each(function(child){
        child.model.acknowledge();
      });
    }
  });

  return Notification;
});
