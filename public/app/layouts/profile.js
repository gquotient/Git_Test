define([
  'backbone',
  'backbone.marionette',

  'user',

  'hbs!layouts/templates/profile'
], function(
  Backbone,
  Marionette,

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

      Backbone.trigger('reset:breadcrumbs', {display_name: 'Profile', state: 'profile' });
      this.user = options.model;

    }
  });
});
