define(
  [
    'jquery',
    'underscore',

    'backbone',
    'backbone.marionette',
    'backbone.marionette.handlebars',

    'user',
    'header',
    'portfolio',
    'project',
    'layouts',
    'breadcrumb'
  ],
  function($, _, Backbone, Marionette, MarionetteHandlebars, User, Header, Portfolio, Project, Layouts, Breadcrumb){

    /* I'm not sure where else to put this right now, so I'm going to put it here.
     * I'm going to extend Backbone's 'Collection' with a method to return a subset of
     * models by ID. It's a shortcut to collection.filter(...).
     */

    Backbone.Collection.prototype.filterByIDs = function(ids){
      return this.filter( function(model){
        return _.contains(ids, model.id);
      });
    };

    // Instantiate the app
    var ia = new Backbone.Marionette.Application();

    // Namespace event aggregation
    ia.listenTo(Backbone, 'all', function(vent, data){
      var myEvent = vent.split(':');
      if(myEvent.length > 1){
        Backbone.trigger(myEvent[0], data);
      }
    });

    // Empty object to hold different layouts. Should we abstract layouts to a module?
    ia.layouts = {};

    /* Some app initialization. Breaking it up for clarity. */

    // Bootstrap User
    ia.addInitializer(function(){
      // Create a new user instance that is the current session user
      ia.currentUser = new User.Model( JSON.parse($('#currentUserData').html()) );
    });
    /*
    ia.addInitializer(function(){
      // Fire a global resize event
      $(window).on('resize', function(event){
        Backbone.trigger('window:resize');
      });
    });
    */

    // Setup Layouts and Views
    ia.addInitializer(function(){
      // Define the primary region (this is the body)
      ia.addRegions({
        main: '#ia'
      });

      ia.layouts.app = new Layouts.Main();

      ia.main.show(ia.layouts.app);
      /*
      // HACK ALERT fire resize method after elements are attached to the DOM
      ia.layouts.app.resize();
      */

      // Build header
      var headerView = new Header.views.LoggedIn({model: ia.currentUser});
      ia.listenTo(headerView, 'logout', function(){
        window.location = '/logout';
      });

      ia.layouts.app.header.show(headerView);

      // Build breadcrumbs
      var breadcrumbs = new Breadcrumb.collections.BreadcrumbList(),
      breadcrumbsView = new Breadcrumb.views.Breadcrumbs({ collection: breadcrumbs });

      ia.layouts.app.pageNavigation.show(breadcrumbsView);
    });

    // Since the portfolio list is so important to the app, let's go ahead
    // and create it.
    ia.addInitializer(function(){
      ia.allProjects = new Project.collections.Projects();
      ia.allPortfolios = new Portfolio.collections.All([],{ projects: ia.allProjects });
      ia.allPortfoliosPortfolio = new Portfolio.models.AllPortfolio({id: 'all', name: 'All Portfolios', projects: ia.allProjects, subPortfolios: ia.allPortfolios });

      ia.allPortfolios.reset( JSON.parse($('#bootstrapPortfolios').html()) );
      ia.allProjects.reset( JSON.parse($('#bootstrapProjects').html()) );

    });

    return ia;
  }
);
