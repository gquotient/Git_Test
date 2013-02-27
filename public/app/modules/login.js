define([
    "backbone",

    "app/ia"
  ],
  function(Backbone, ia){

    var Login = {
      views: {}
    };

    Login.views.LoginView = Backbone.View.extend({
      template: template,

      events: {
        "click #loginButton": "login"
      },

      login:function (event) {
          
          event.preventDefault(); // Don't let this button submit the form
          var url = '/login';
          console.log('Loggin in... ');
          var formValues = {
              username: $('#inputUsername').val(),
              password: $('#inputPassword').val()
          };

          $.ajax({
              url:url,
              type:'POST',
              dataType:"json",
              data: formValues,
              success:function (data) {
                Backbone.history.navigate("/users", {trigger: true});
              }
          });
      },

      render: function(){
          this.$el.append(this.template());
      }

    });

    return Login;
});