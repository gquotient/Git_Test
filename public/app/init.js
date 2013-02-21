// Init app
define(
  [
      'app/ia',
      'app/router'
  ],
  function (ia, Router) {

    // File: web/js/main.js
    // Tell jQuery to watch for any 401 or 403 errors and handle them appropriately
    $.ajaxSetup({
        statusCode: {
            401: function(){
                // Redirec the to the login page.
                window.location.replace('/login');
             
            },
            403: function() {
                // 403 -- Access denied
                window.location.replace('/login');
            }
        }
    });

    ia.router = new Router();
    Backbone.history.start( {pushState: true, root: ia.root } );
  }
);
