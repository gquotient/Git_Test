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
      class: 'basicView'
    },
    regions: {
      editUser: '#editUser'
    },


    onShow: function(){
      var editUser = new User.views.edit({model: this.model});

      this.editUser.show(editUser);
    },

    initialize: function(options){
      console.log(options.model);
      this.model = options.model;
    }
  });
});
