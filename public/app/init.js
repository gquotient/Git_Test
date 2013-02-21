// Init app
define(
  [
      'jquery',
      'underscore',
      'backbone',
      'handlebars',

      'app/ia',
      'app/router'
  ],
  function ($, _, Backbone, Handlebars, ia, Router) {
    //Create app namespace
    //window.ia = window.ia || {};



    //Replace body content with main view
    // if (true) {
    //   $('body').html(ia.views.index);
    // } else {
    //   $('body').html(ia.views.login);
    // }

    ia.router = new Router();
    Backbone.history.start( {pushState: true, root: ia.root } );
  }
);
