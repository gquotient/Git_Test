define([
  'backbone',
  'backbone.marionette',

  'portfolio',
  'project',

  'hbs!layouts/portfolios/templates/operator'
], function(
  Backbone,
  Marionette,

  Portfolio,
  Project,

  operatorviewTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: operatorviewTemplate
    },
    className: 'operator',
    regions: {
      projects: '.projects'
    },
    ui: {
      projects: '.projects'
    },
    fullscreen: {
      active: false,
      activate: false,
      close: false
    },
    events: {
      'click .fullscreen': 'toggleFullscreen'
    },
    initFullscreen: function(){
      var el = this.ui.projects[0];

      // Save fullscreen method
      this.fullscreen.activate = el.webkitRequestFullScreen || el.mozRequestFullScreen || el.requestFullScreen;

      // Save exit fullscreen method
      this.fullscreen.close = document.webkitExitFullScreen || document.mozCancelFullScreen || document.exitFullScreen;

      // Add button only if fullscreen API is available
      if (this.fullscreen.activate) {
        this.$el.append('<button class="fullscreen button sml">Fullscreen</button>');
      }
    },
    toggleFullscreen: function(){
      if (!this.fullscreen.active) {
        this.fullscreen.active = true;
        this.fullscreen.activate.call(this.ui.projects[0]);
      } else {
        this.fullscreen.active = false;
        this.fullscreen.close.call(document);
      }
    },
    onShow: function(){
      // Update URL
      Backbone.history.navigate('/portfolios/' + this.model.id + '/operator');

      // Instantiate dashboard view
      var dashboardView = new Project.views.Dashboard({collection: this.model.projects});

      // Show dashboard view
      this.projects.show(dashboardView);

      this.initFullscreen();
    }
  });
});
