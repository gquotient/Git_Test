// Init app
define(
  [
      'app/ia',
      'app/router'
  ],
  function (ia, Router) {
    ia.router = new Router();
    Backbone.history.start( {pushState: true, root: ia.root } );
  }
);
