define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'ia',

  'user',

  'hbs!layouts/templates/index',
  'hbs!layouts/templates/header',
  'hbs!layouts/templates/profile',
  'hbs!layouts/templates/portfolioDetail',
  'hbs!layouts/templates/projectDetail',

  'hbs!layouts/templates/portfolioDashboard'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,
  ia,
  User,
  indexTemplate,
  headerTemplate,
  profileTemplate,
  portfolioDetailTemplate,
  projectDetailTemplate,
  portfolioDashboardTemplate
){
  var Layouts = {};

  // Unit conversion
  var roundNumber = function(num, dec) {
    var result = (num !== null)?Math.round(num*Math.pow(10,dec))/Math.pow(10,dec):null;
    return result;
  };

  Handlebars.registerHelper('tokW', function(value) {
    return roundNumber((+value / 1000), 1);
  });

  Handlebars.registerHelper('toMW', function(value) {
    return roundNumber((+value / 1000000), 2);
  });

  Handlebars.registerHelper('percent', function(value, max){
    return value/max * 100;
  });

  // MAIN LAYOUT

  Layouts.Main = Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: indexTemplate
    },
    regions: {
      header: '#header',
      //navigation: '#navigation',
      pageNavigation: '#nav_page',
      mainContent: '#page'
    }
  });

  // HEADER

  Layouts.Header = Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: headerTemplate
    },
    triggers: {
      'click .logout': 'logout',
      'click .profile': 'profile'
    },
    initialize: function(){
      this.listenTo(this, 'logout', function(){
        window.location = '/logout';
      });

      this.listenTo(this, 'profile', function(){
        Backbone.history.navigate('/profile', true);
      });
    }
  });

  // PROJECT DETAIL LAYOUT

  Layouts.Profile = Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: profileTemplate
    },
    attributes: {
      class: 'basicView'
    },
    regions: {
      editUser: '#editUser'
    },
    onShow: function(){
      var editUser = new User.views.edit({model: ia.currentUser});

      this.editUser.show(editUser);
    },
    initialize: function(){

    }
  });

  // PORTFOLIO DETAIL LAYOUT

  Layouts.PortfolioDetail = Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: portfolioDetailTemplate
    },
    attributes: {
      class: 'portfolioView'
    },
    regions: {
      kpis: '#kpis',
      map: '#map',
      projects: '#projects',
      contentNavigation: '#nav_content'
    }
  });

  // PROJECT DETAIL LAYOUT

  Layouts.ProjectDetail = Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: projectDetailTemplate
    },
    attributes: {
      class: 'projectView'
    },
    regions: {
      map: '#map',
      kpis: '#kpis',
      alarms: '#alarms'
    }
  });

  // PORTFOLIO DASHBOARD LAYOUT

  Layouts.PortfolioDashboard = Backbone.Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: portfolioDashboardTemplate
    },
    attributes: {
      class: 'portfolioDashboard'
    },
    regions: {
      dashboard: '#dashboard',
      contentNavigation: '#nav_content'
    }
  });

  return Layouts;
});
