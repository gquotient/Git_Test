define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!breadcrumb/templates/breadcrumbItemView'
], function($, _, Backbone, Marionette, breadcrumbItemViewTemplate){
  var Breadcrumb = { models: {}, views: {}, layouts: {}, collections: {} };

    Breadcrumb.collections.BreadcrumbList = Backbone.Collection.extend({
      update: function(models){
        // Check if the origin is the same
        if (models.length > 1 && this.models[0] === models[0]) {
          // If the last model exists, just prune
          if (this.models.indexOf(models[models.length - 1]) >= 0) {
            this.prune(models[1]);
          } else {
            // If last model doesn't exist, assume we are pushing a child
            this.add(models[models.length - 1]);
          }
        } else {
          // If origin is different, force fresh models
          this.reset(models);
        }
      },
      prune: function(model){
        // Return only the models from the first to the passed model
        var models = this.models.slice(0, (this.models.indexOf(model)) + 1);
        // Set the collection as the new list of models
        this.reset(models);
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

        // Any select event will add it's selected model to the bread crumbs
        this.listenTo(Backbone, 'select', function(model){
          that.collection.add( model );
        });
        // Listen for routers to reset breadcrumbs completely
        this.listenTo(Backbone, 'set:breadcrumbs', function(models){
          that.collection.update(models);
        });
        // Listen for prune event on ItemView
        Backbone.listenTo(this, 'itemview:prune', function(itemView){
          var model = itemView.model;
          // Fire global select event
          Backbone.trigger('select:' + model.get('type'), model);
          // Prune collection
          that.collection.prune(model);
        });
      }
    });

    return Breadcrumb;
});
