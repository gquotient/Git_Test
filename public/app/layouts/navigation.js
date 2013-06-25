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

    initialize: function(options){
      this.app = options.app;

      var breadcrumbs = new Breadcrumb.Collection();
      this.breadcrumbsView = new Breadcrumb.views.Breadcrumbs({collection: breadcrumbs});

      this.listenTo(Backbone, 'set:breadcrumbs', function(model){
        var breadcrumbModel = new Breadcrumb.Model(model);

        if(this.app.state !== breadcrumbModel.get('state')){
          breadcrumbs.advance(breadcrumbModel);
          this.app.state = breadcrumbModel.get('state');
        } else {
          breadcrumbs.update(breadcrumbModel);
        }
      }, this);

    },

    onShow: function(){
      this.crumbs.show(this.breadcrumbsView);
    }
  });
});
