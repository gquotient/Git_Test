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

    'hbs!app/layouts/index'
  ],

  function($, _, Backbone, Marionette, MarionetteHandlebars, User, Header, Portfolio, Project, indexTemplate){

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

    // Empty object to hold different layouts. Should we abstract layouts to a module?
    ia.layouts = {};

    // Create a new layout for the primary app view
    var AppLayout = Backbone.Marionette.Layout.extend({
      template: {
        type: 'handlebars',
        template: indexTemplate
      },
      regions: {
        header: '#header',
        navigation: '#navigation',
        pageNavigation: '#nav_page',
        contentNavigation: '#nav_content',
        mainContent: '#content'
      },
      onRender: function(){
        // This is almost useless sense render will have fire before the elements are added to the DOM
        this.resize();
      },
      resize: function(){
        // Set wrapper container to fill the window
        var $content = this.$el.find('.contentContainer'),
        myOffset = $content.offset();

        // Window height minus offset is the easy way to _fill the rest_ of the window
        $content.height($(window).height() - myOffset.top);
      },
      initialize: function(){
        var that = this;

        // Listen for global window resize trigger and fire resize method
        this.listenTo(ia, 'windowResize', function(event){
          that.resize();
        });
      }
    });

    /* Some app initialization. Breaking it up for clarity. */

    // Bootstrap User
    ia.addInitializer(function(){
      // Create a new user instance that is the current session user
      ia.currentUser = new User.Model( JSON.parse($('#currentUserData').html()) );
    });

    ia.addInitializer(function(){
      // Fire a global resize event
      $(window).on('resize', function(event){
        ia.trigger('windowResize');
      });
    });


    // Setup Layouts and Views
    ia.addInitializer(function(){
      // Define the primary region (this is the body)
      ia.addRegions({
        main: '#ia'
      });

      ia.layouts.app = new AppLayout();

      /*
      ia.layouts.app.listenTo($(window), 'resize', function(event){
        console.log(this, 'resize');
      });
      */

      var headerView = new Header.views.LoggedIn({model: ia.currentUser});
      ia.listenTo(headerView, 'logout', function(){
        window.location = '/logout';
      });

      ia.main.show(ia.layouts.app);
      // HACK ALERT fire resize method after elements are attached to the DOM
      ia.layouts.app.resize();

      ia.layouts.app.header.show(headerView);
    });

    // Since the portfolio list is so important to the app, let's go ahead
    // and create it.
    ia.addInitializer(function(){
      ia.allProjects = new Project.collections.DataList(JSON.parse($('#bootstrapProjects').html()));
      ia.allPortfolios = new Portfolio.collections.All(JSON.parse($('#bootstrapPortfolios').html()));
      ia.allPortfoliosPortfolio = new Portfolio.models.Portfolio({name: 'Stupid Portfolios', projects: [], subPortfolios: ia.allPortfolios });
      ia.allPortfolios.projects = ia.allProjects;
    });

    return ia;
  }
);
