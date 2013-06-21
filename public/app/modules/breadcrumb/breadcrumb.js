define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!breadcrumb/templates/breadcrumbItemView'
], function(
  $,
  _,
  Backbone,
  Marionette,

  breadcrumbItemViewTemplate
){
  var Breadcrumb = { views: {} };

  Breadcrumb.Model = Backbone.Model.extend({

  });

  Breadcrumb.Collection = Backbone.Collection.extend({
    model: Breadcrumb.Model,
    prune: function(model){
      var m = this.find(function(realModel){
        return realModel === model;
      })
      // Return only the models from the first to the passed model
      var models = this.models.slice(0, (this.models.indexOf(m)) + 1);
      // Set the collection as the new list of models
      this.set(models);
    },

    update: function(model){
      this.pop();
      this.push(model);
    },

    advance: function(model){
      var models = this.pluck('model');
      if (_.contains(models, model.get('model')) ) {
        this.prune(model);
      } else {
        this.add(model);
      }
    }
  });

  Breadcrumb.views.BreadcrumbItemView = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: breadcrumbItemViewTemplate
    },
    triggers: {
      'click': 'prune'
    },
    serializeData: function(){
      return this.model.get('model').toJSON();
    }
  });

  Breadcrumb.views.Breadcrumbs = Marionette.CollectionView.extend({
    tagName: 'ul',
    itemView: Breadcrumb.views.BreadcrumbItemView,
    attributes: {
      class: 'breadcrumbs'
    },
    initialize: function(options){
      var that = this;

      // Listen for prune event on ItemView
      Backbone.listenTo(this, 'itemview:prune', function(itemView){
        var model = itemView.model;
        // Fire global select event
        Backbone.trigger('select:' + model.get('state'), model.get('model'));
        // Prune collection
        that.collection.prune(model);
      });
    }
  });

  return Breadcrumb;
});
