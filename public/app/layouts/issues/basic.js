define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'project',
  'device',
  'chart',
  'issue',

  'hbs!layouts/issues/templates/basic'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,

  Project,
  Device,
  Chart,
  Issue,

  BasicTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: BasicTemplate
    },

    regions: {
      chart: '.chart'
    },

    onShow: function(){
      Backbone.trigger(
        'set:breadcrumbs',
        {
          model: this.options.model,
          state: 'issue',
          display_name: this.options.model.get('display_name')
        }
      );
    },

    initialize: function(options){
      console.log(options.model);
    }
  });
});
