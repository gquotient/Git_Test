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

      this.listenTo(Backbone, 'reset:breadcrumbs', function(model){
        breadcrumbs.reset(model);
      });

      this.listenTo(Backbone, 'set:breadcrumbs', function(model){
        console.log(model);
        console.log(this.app.state, model.get('type'));
        if(this.app.state !== model.get('type')){
          breadcrumbs.advance(model);
        } else {
          breadcrumbs.update(model);
        }
      }, this);

      this.listenTo(Backbone, 'update:breadcrumbs', function(model){
        breadcrumbs.update(model);
      });
    },

    onShow: function(){
      this.crumbs.show(this.breadcrumbsView);
    }
  });
});
