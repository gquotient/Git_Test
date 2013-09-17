define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',

  'hbs!layouts/admin/alarms/templates/projectAlarms'
], function(
  _,
  $,
  Backbone,
  Marionette,
  Handlebars,

  ia,

  projectAlarmsTemplate
){
  return Marionette.Layout.extend({
    tagName: 'table',
    className: 'basic',
    template: {
      type: 'handlebars',
      template: projectAlarmsTemplate
    },
    initialize: function(options){
      console.log('init project alarms', options);


    },
    serializeData: function(){
      return {
        project: this.model,
        alarms: this.options.alarms
      }
    }
  });
});
