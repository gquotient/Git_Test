define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',

  'issue',

  'hbs!layouts/admin/alarms/templates/editAlarm'
], function(
  _,
  $,
  Backbone,
  Marionette,
  Handlebars,

  ia,

  Issue,

  editAlarmTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: editAlarmTemplate
    },
    regions: {
      conditions: '.conditionContainer'
    },
    triggers: {
      'click .addCondition': 'addCondition'
    },
    initialize: function(options){
      this.conditionsView = new Issue.views.Conditions({collection: new Backbone.Collection()});
    },
    onShow: function(){
      this.conditions.show(this.conditionsView);
    },
    onAddCondition: function(){
      this.conditionsView.collection.add({});
    }
  });
});