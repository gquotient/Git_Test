define([
  "app"
], 

function(app){
  var Test = { Views: {} };

  app.Test = Test;

  Test.Model = Backbone.Model.extend({

  });

  Test.Collection = Backbone.Collection.extend({
    url: '/api/test',

    model: Test.Model
  });

  Test.Views.List = Backbone.View.extend({
    template: 'test/list'
  });

  Test.Views.Detail = Backbone.View.extend({
    template: 'test/detail'
  });

  return Test;

})