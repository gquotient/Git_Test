define([
  'backbone',
  'backbone.marionette',

  'breadcrumb',

  'hbs!layouts/templates/navigation'
], function(
  Backbone,
  Marionette,

  Breadcrumb,

  navigationTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: navigationTemplate
    },

    regions: {
      crumbs: '#breadcrumbs'
    },

    setBreadcrumbs: function(model){
      var breadcrumbModel = new Breadcrumb.Model(model);

      if(this.app.state !== breadcrumbModel.get('state')){
        this.breadcrumbs.advance(breadcrumbModel);
        this.app.state = breadcrumbModel.get('state');
      } else {
        this.breadcrumbs.update(breadcrumbModel);
      }
    },

    resetBreadcrumbs: function(model){
      var breadcrumbModel = new Breadcrumb.Model(model);

      this.breadcrumbs.reset([breadcrumbModel]);
      this.app.state = breadcrumbModel.get('state');
    },

    initialize: function(options){
      this.app = options.app;

      this.breadcrumbs = new Breadcrumb.Collection();
      this.breadcrumbsView = new Breadcrumb.views.Breadcrumbs({collection: this.breadcrumbs});

      this.listenTo(Backbone, 'set:breadcrumbs', function(model){
        this.setBreadcrumbs(model);
      }, this);

      this.listenTo(Backbone, 'reset:breadcrumbs', function(model){
        this.resetBreadcrumbs(model);
      });

    },

    onShow: function(){
      this.crumbs.show(this.breadcrumbsView);
    }
  });
});
