define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'hbs!layouts/templates/index',
  'hbs!layouts/templates/header',
  'hbs!layouts/templates/profile'
], function(
  $,
  _,
  Backbone,
  Marionette,
  Handlebars,
  indexTemplate,
  headerTemplate,
  profileTemplate
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

 return Layouts;
});
