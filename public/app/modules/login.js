define([
    "backbone",
    "handlebars"
  ],
  function(Backbone, Handlebars){

    var Login = {
      views: {}
    };

    Login.views.LoginView = Backbone.View.extend({
      template: "Login Here",

      render: function(){
        this.$el.append(Handlebars.compile(this.template));
      }
    });

    return Login;
});