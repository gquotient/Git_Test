// Init app
define(
  [
      'jquery',
      'ia',
      'app/router'
  ],
  function ($, ia, Router) {
    // Tell jQuery to watch for any 401 or 403 errors and handle them appropriately
    $.ajaxSetup({
        statusCode: {
            401: function(){
                // console.log("401 here");
                // Redirec the to the login page.
                window.location.replace('/login');
            },
            403: function() {
                // 403 -- Access denied
                window.location.replace('/login');
            }
        }
    });

    ia.addInitializer(function(options){
      new Router();
      Backbone.history.start({ pushState: true, root: "/ia" });
    });

    ia.start();
  }
);
