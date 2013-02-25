define([
    "backbone",
    "underscore",
    "handlebars",
    "text!app/layouts/login.hbs"
  ],
  function(Backbone, _, Handlebars, template){

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
                  console.log(["Login request details: ", data]);

                  if(data.error) {  // If there is an error, show the error messages
                      $('body').text(data.error.text).show();
                  }
                  else { // If not, send them back to the home page
                      console.log("all's good.")
                  }
              }
          });
      },

      render: function(){
          this.$el.append(Handlebars.compile(this.template));
      }

    });

    return Login;
});