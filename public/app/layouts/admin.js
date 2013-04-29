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
      editUsers: '#editUsers'
    },

    onShow: function(){
      var users = new User.Collection();
      users.fetch();

      this.editUsers.show( new User.views.editTable({ collection: users }) );
    },

    initialize: function(){

    }
  });
});
