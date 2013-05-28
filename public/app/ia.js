define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',

  'user',
  'portfolio'
], function(
  $,
  _,
  Backbone,
  Marionette,
  MarionetteHandlebars,

  User,
  Portfolio
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
  ia.rootPortfolio = new Portfolio.Root({id: 'all', name: 'All Portfolios'});

  // Bootstrap the root portfolios and projects
  ia.currentUser = ia.users.push( JSON.parse($('#currentUserData').html()) );
  //ia.rootPortfolio.portfolios.add( JSON.parse($('#bootstrapPortfolios').html()) );
  ia.rootPortfolio.projects.add( JSON.parse($('#bootstrapProjects').html()) );

  return ia;
});
