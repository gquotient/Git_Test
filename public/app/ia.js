define(
  [
    'jquery',
    'underscore',

    'backbone',
    'backbone.marionette',
    'backbone.marionette.handlebars',

    'user',
    'portfolio',
    'project'
  ],
  function($, _, Backbone, Marionette, MarionetteHandlebars, User, Portfolio, Project, Layouts, Breadcrumb){

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

    // Bootstrap User
    ia.currentUser = new User.Model( JSON.parse($('#currentUserData').html()) );

    // Since the portfolio list is so important to the app, let's go ahead
    // and create it.
    ia.allProjects = new Project.collections.Projects();
    ia.allPortfolios = new Portfolio.collections.All([],{ projects: ia.allProjects });
    ia.allPortfoliosPortfolio = new Portfolio.models.AllPortfolio({id: 'all', name: 'All Portfolios', projects: ia.allProjects, subPortfolios: ia.allPortfolios });

    ia.allPortfolios.reset( JSON.parse($('#bootstrapPortfolios').html()) );
    ia.allProjects.reset( JSON.parse($('#bootstrapProjects').html()) );

    ia.addRegions({
      main: '#ia'
    });

    // Namespace event aggregation
    ia.listenTo(Backbone, 'all', function(vent, data){
      var myEvent = vent.split(':');
      if(myEvent.length > 1){
        Backbone.trigger(myEvent[0], data);
      }
    });

    return ia;
  }
);
