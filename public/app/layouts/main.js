define(
[
  'jquery',
  'backbone',
  'backbone.marionette',
  'handlebars',

  'portfolio',
  'project',
  'breadcrumb',

  'layouts/header',

  'hbs!layouts/templates/index'
],
function(
  $,
  Backbone,
  Marionette,
  Handlebars,

  Portfolio,
  Project,
  Breadcrumb,

  Header,

  indexTemplate
){

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

// MAIN LAYOUT/CONTROLLER
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: indexTemplate
    },
    regions: {
      header: '#header',
      //navigation: '#navigation',
      pageNavigation: '#nav_page',
      mainContent: '#page'
    },

    currentState: '',

    onShow: function(){
      this.header.show(this.headerView);
      this.pageNavigation.show(this.breadcrumbsView);
    },

    updateBreadcrumbs: function(model){
      this.breadcrumbs.add(model);
    },

    initialize: function(app){
      this.app = app;

      // Build header
      this.headerView = new Header({model: app.currentUser});
      // Build breadcrumbs
      this.breadcrumbs = new Breadcrumb.collections.BreadcrumbList([app.allPortfoliosPortfolio]);
      this.breadcrumbsView = new Breadcrumb.views.Breadcrumbs({ collection: this.breadcrumbs });


      // Any select event will add it's selected model to the bread crumbs
      this.listenTo(Backbone, 'select', function(model){
        this.breadcrumbs.add( model );
      });
      // Listen for routers to reset breadcrumbs completely
      this.listenTo(Backbone, 'set:breadcrumbs', function(models){
        this.breadcrumbs.update(models);
      });

      // this.listenTo('select', function(){

      // })

      // Reset breadcrumbs
      // var breadcrumbs = [app.allPortfoliosPortfolio];

      // breadcrumbs.set(app.allPortfoliosPortfolios);

      // if (model !== app.allPortfoliosPortfolio) {
      //   breadcrumbs.push(model);
      // }

      // Backbone.trigger('set:breadcrumbs', breadcrumbs);
    }
  });
});
