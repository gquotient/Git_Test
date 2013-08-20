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
    is: function(model){
      return model.get('display_name') === this.get('display_name') && model.get('state') === this.get('state');
    }
  });

  Breadcrumb.Collection = Backbone.Collection.extend({
    model: Breadcrumb.Model,
    prune: function(model){
      var m = this.find(function(realModel){
        return realModel.get('model') === model.get('model');
      });

      // Return only the models from the first to the passed model
      var models = this.models.slice(0, (this.models.indexOf(m)) + 1);
      // Set the collection as the new list of models
      this.set(models);
    },
    hasModel: function(model){
      var containsModel = false;
      this.each(function(breadcrumbModel){
        if( breadcrumbModel.is(model) ){
          containsModel = true;
        }
      });

      return containsModel;
      // return model.display_name === this.display_name && model.state === this.state;
    },
    update: function(model){
      this.pop();
      this.push(model);
    },

    advance: function(model){
      if ( this.hasModel(model) ) {
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
        console.log(itemView);
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
