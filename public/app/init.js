// Init app
require(
  [
      'jquery',
      'underscore',
      'backbone',
      'handlebars'
  ],
  function ($, _, Backbone, Handlebars, somemodule) {
    //Create app namespace
    window.ia = window.ia || {};

    console.log("Hooray! We have an app.", ia);

    //Create global views namespace
    ia.views = {};

    //Compile primary templates
    ia.views.index = Handlebars.compile($('#index').html());
    ia.views.login = Handlebars.compile($('#login').html());

    //Replace body content with main view
    if (true) {
      $('body').html(ia.views.index);
    } else {
      $('body').html(ia.views.login);
    }
  }
);
