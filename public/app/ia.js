define(
  
  [
    'backbone',
    'backbone.marionette'
  ],
  
  function(Backbone, Marionette){

    var states = {
      "login": {
        layout: {
          name: "login"
        }
      }
    };

    var ia = new Backbone.Marionette.Application();

    return ia;
  }

);
