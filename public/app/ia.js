define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',

  'user',
  'portfolio',
  'project'
], function(
  $,
  _,
  Backbone,
  Marionette,
  MarionetteHandlebars,

  User,
  Portfolio,
  Project
){
  var ia = new Marionette.Application();

  // Namespaced event aggregation
  ia.listenTo(Backbone, 'all', function(vent, data){
    var myEvent = vent.split(':');
    if(myEvent.length > 1){
      Backbone.trigger(myEvent[0], data);
    }
  });

  // Add body#ia has the main app region
  ia.addRegions({
    main: '#ia'
  });

  // Create global collections and models
  ia.users = new User.Collection();
  // ia.rootPortfolio = new Portfolio.MOdel({label: 'all', display_name: 'All Portfolios'});

  // Bootstrap the root portfolios and projects
  ia.currentUser = ia.users.push( JSON.parse($('#currentUserData').html()) );

  ia.projects = new Project.Collection();
  ia.portfolios = new Portfolio.Collection( JSON.parse($('#bootstrapPortfolios').html()), { projects: ia.projects } );
  ia.projects.add( JSON.parse($('#bootstrapProjects').html()) );
  // ia.rootPortfolio.portfolios.add( JSON.parse($('#bootstrapPortfolios').html()) );
  // ia.rootPortfolio.projects.add( JSON.parse($('#bootstrapProjects').html()) );
  ia.currentTeam = ia.currentUser.get('currentTeam');
  // ia.currentUser.set('currentTeam', ia.currentTeam);
  return ia;
});
