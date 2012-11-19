define([
  "app",

  "hbs!templates/test/list"
],

function(app, listTemplate){
  var Test = { Views: {} };

  app.Test = Test;

  Test.Model = Backbone.Model.extend({

  });

  Test.Collection = Backbone.Collection.extend({
    url: '/api/test',

    model: Test.Model
  });

  Test.Views.List = Backbone.View.extend({
    template: listTemplate,

    render: function(){
      $("body").append(this.template());
      return this;
    },

    initialize: function(){
      this.collection.on('reset', this.render, this);
    }
  });

  Test.Views.Detail = Backbone.View.extend({
    template: 'test/detail'
  });

  return Test;

});