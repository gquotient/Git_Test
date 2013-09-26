define([
  'backbone',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',

  'hbs!layouts/portfolios/templates/operator'
], function(
  Backbone,
  Marionette,
  Handlebars,

  Portfolio,
  Project,

  operatorviewTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: operatorviewTemplate
    },
    regions: {
      dashboard: '.dashboard'
    },
    onShow: function(){
      // Update URL
      Backbone.history.navigate('/portfolios/' + this.model.id + '/operator');

      // Instantiate dashboard view
      var dashboardView = new Project.views.Dashboard({collection: this.model.projects});

      // Show dashboard view
      this.dashboard.show(dashboardView);
    }
  });
});
