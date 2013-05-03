define([
  'backbone',
  'backbone.marionette',
  'handlebars',

  'breadcrumb',

  'hbs!layouts/templates/navigation'
], function(
  Backbone,
  Marionette,
  Handlebars,

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

    onShow: function(){
      this.crumbs.show(this.breadcrumbsView);
    },

    initialize: function(){
      var breadcrumbs = new Breadcrumb.Collection();
      this.breadcrumbsView = new Breadcrumb.views.Breadcrumbs({collection: breadcrumbs});

      this.listenTo(Backbone, 'reset:breadcrumbs', function(model){
        breadcrumbs.reset(model);
      });

      this.listenTo(Backbone, 'set:breadcrumbs', function(model){
        breadcrumbs.update(model);
      });
    }
  });
});
