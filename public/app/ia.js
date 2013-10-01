define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',

  'user',
  'portfolio',
  'project',
  'equipment'
], function(
  $,
  _,
  Backbone,
  Marionette,
  MarionetteHandlebars,

  User,
  Portfolio,
  Project,
  Equipment
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
  ia.currentUser = ia.users.push( JSON.parse($('#currentUserData').html()) );
  ia.currentTeam = ia.currentUser.get('currentTeam');

  ia.projects = new Project.Collection( JSON.parse($('#bootstrapProjects').html()) , {
    url: function(options){
      return '/api/teamprojects/' + this.org + '_' + this.team;
    }
  });

  // This is pretty hacky...
  ia.projects.team = ia.currentTeam;
  ia.projects.org = ia.currentUser.get('org_label');

  ia.alignedProjects = new Project.Collection();

  ia.portfolios = new Portfolio.Collection( JSON.parse($('#bootstrapPortfolios').html()), {
    projects: ia.projects,
    comparator: 'display_name'
  });

  // Throw no portfolios error
  if (!ia.portfolios.length) {
    throw 'No portfolios found for selected team';
  }

  ia.equipment = new Equipment.Collection( JSON.parse($('#bootstrapEquipment').html()) );

  return ia;
});
