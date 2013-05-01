define([
  'backbone',
  'backbone.marionette',
  'handlebars',

  'user',

  'hbs!layouts/templates/profile'
], function(
  Backbone,
  Marionette,
  Handlebars,

  User,

  profileTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: profileTemplate
    },
    attributes: {
      class: 'basicView',
      id: 'page-profile'
    },
    regions: {
      editUser: '#editUser'
    },


    onShow: function(){
      this.editUser.show( new User.views.edit( {model: this.user} ));
    },

    initialize: function(options){
      this.user = options.model;
    }
  });
});
