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

    this.listenTo(this.models, 'add', function(model){ model.trigger('selected'); });
    this.listenTo(this.models, 'remove', function(model){ model.trigger('deselected'); });
  };

  function getModelsFromItems(items){
    if (!items) { return []; }
    if (!_.isArray(items)) { items = [items]; }

    return _.pluck(items, 'model');
  }

  _.extend(Selection.prototype, Backbone.Events, {

    contains: function(item){
      return this.models.contains(item.model);
    },

    add: function(items, options){
      this.models.add(getModelsFromItems(items), options);
      Backbone.trigger('editor:selection', this.models);
    },

    remove: function(items, options){
      this.models.remove(getModelsFromItems(items), options);
      Backbone.trigger('editor:selection', this.models);
    },

    moveAll: function(delta){
      this.models.each(function(model) {
        model.set('positionX', model.get('positionX') + delta.x);
        model.set('positionY', model.get('positionY') + delta.y);
      });
    },

    snapAll: function(){
      this.models.each(function(model) {
        model.set('positionX', Math.round(model.get('positionX') / 100) * 100);
        model.set('positionY', Math.round(model.get('positionY') / 100) * 100);
      });
    }
  });

  return Selection;
});
