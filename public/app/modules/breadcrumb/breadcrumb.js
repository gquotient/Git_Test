define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!breadcrumb/templates/breadcrumbItemView'
], function($, _, Backbone, Marionette, breadcrumbItemViewTemplate){
  var Breadcrumb = { models: {}, views: {}, layouts: {}, collections: {} };

    Breadcrumb.collections.BreadcrumbList = Backbone.Collection.extend({
      initialize: function(){
        var that = this;
        // Any select event will add it's selected model to the bread crumbs
        this.listenTo(Backbone, 'select', function(model){
          that.add( model );
        });
        // Listen for routers to reset breadcrumbs completely
        this.listenTo(Backbone, 'set:breadcrumbs', function(models){
          that.reset(models);
        });
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
      prune: function(model){
        // Return only the models from the first to the passed model
        var models = this.collection.slice(0, (this.collection.indexOf(model)) + 1);
        // Set the collection as the new list of models
        this.collection.reset(models);
      },
      initialize: function(options){
        var that = this;

        Backbone.listenTo(this, 'itemview:prune', function(view){
          var model = view.model;
          // Fire global select event
          Backbone.trigger('select:' + model.get('type'), model);
          // Prune collection
          that.prune(model);
        });
      }
    });

    return Breadcrumb;
});