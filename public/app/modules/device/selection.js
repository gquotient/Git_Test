define([
  'jquery',
  'underscore',
  'backbone'
], function(
  $,
  _,
  Backbone
){
  var Selection = function(){
    this.models = new Backbone.Collection();
  };

  function getModelsFromItems(items){
    if (!items) { return []; }
    if (!_.isArray(items)) { items = [items]; }

    return _.pluck(items, 'model');
  }

  _.extend(Selection.prototype, {

    contains: function(item){
      return this.models.contains(item.model);
    },

    add: function(items, options){
      this.models.add(getModelsFromItems(items), options);
    },

    remove: function(items, options){
      this.models.remove(getModelsFromItems(items), options);
    },

    clear: function(){
      this.models.reset([], {silent: false});
    },

    moveAll: function(delta){
      this.models.each(function(model) {
        var position = model.get('position');

        model.set('position', {
          x: position.x + delta.x,
          y: position.y + delta.y
        });
      });
    },

    snapAll: function(){
      this.models.each(function(model) {
        var position = model.get('position');

        model.set('position', {
          x: Math.round(position.x / 100) * 100,
          y: Math.round(position.y / 100) * 100
        });
      });
    }
  });

  return Selection;
});
