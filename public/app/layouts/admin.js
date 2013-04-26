define([
  'backbone',
  'backbone.marionette',
  'handlebars',

  'user',

  'hbs!layouts/templates/admin'
], function(
  Backbone,
  Marionette,
  Handlebars,

  User,

  adminTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: adminTemplate
    },
    attributes: {
      class: 'basicView'
    },
    regions: {

    },

    onShow: function(){

    },

    initialize: function(){

    }
  });
});
