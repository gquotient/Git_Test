define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',

  'user',
  // 'team',
  // 'organization',

  'hbs!layouts/adminLayouts/templates/user'
], function(
  _,
  $,
  Backbone,
  Marionette,
  Handlebars,

  ia,

  User,
  // Team,
  // Organization,

  userTemplate
){

  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: userTemplate
    },
    
    getView: function(page){
      var
        viewConfig = config.views[page],
        collection = new viewConfig.collection(),
        view = new viewConfig.view({collection: collection})
      ;

      collection.fetch();

      return view;
    },

    renderView: function(view){
      var myView = this.getView(view);

      // Set active nav element
      this.$el.find('.nav_content li').removeClass('active');
      this.$el.find('.nav_content li.' + view).addClass('active');

      // Display view
      this.pageContent.show(myView);

      // Update history
      Backbone.history.navigate('/admin/' + view);
    },

    renderDetailView: function(options){
      var viewConfig = config.views[options.page];
      this.pageContent.show( viewConfig.detail(options) );
    },

    onShow: function(){
      this.renderView(this.initialView, this.page_id);
    },

    showUsers: function(){
      this.renderView('users');
    },

    showTeams: function(){
      this.renderView('teams');
    },

    showAlarms: function(){

    },

    events: {
      'click .nav_content a': function(event){
        event.preventDefault();

        // This seems kind of hacky, but (shrug)
        var route = event.target.hash.replace('#', '');

        // Build view
        this.renderView(route);

        // Keep track of current view.
        this.view = route;
      }
    },

    initialize: function(options){
      this.view = this.initialView = options.initialView || 'users';

      Backbone.trigger('reset:breadcrumbs', {
        state:'admin',
        display_name: 'Admin'
      });

      this.detail = this.options.detail;

      this.listenTo(Backbone, 'detail', function(model){
        this.renderDetailView({ model: model, page: this.view });
        Backbone.history.navigate('/admin/'+ this.view + '/' + model.id);
      }, this);
    }
  });

});
