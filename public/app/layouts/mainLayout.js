// define([
//   'jquery',
//   'underscore',
//   'backbone',
//   'backbone.marionette',
//   'handlebars',

//   'hbs!layouts/templates/index',
//   'hbs!layouts/templates/header',
//   'hbs!layouts/templates/profile',
//   'hbs!layouts/templates/portfolioDetail',
//   'hbs!layouts/templates/projectDetail',

//   'hbs!layouts/templates/portfolioDashboard'
// ], function(
//   $,
//   _,
//   Backbone,
//   Marionette,
//   Handlebars,
//   headerTemplate,
//   profileTemplate,
//   portfolioDetailTemplate,
//   projectDetailTemplate,
//   portfolioDashboardTemplate



define(
[
  'jquery',
  'backbone',
  'backbone.marionette',

  'ia',

  'layouts',

  'portfolio',
  'project',
  'breadcrumb',

  'hbs!layouts/templates/index'
],
function(
  $,
  Backbone,
  Marionette,
  ia,

  Layouts,

  Portfolio,
  Project,
  Breadcrumb,

  indexTemplate
){

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

    // portfolioDetail: function(model, collection){
    // },

    // projectDetail: function(model){
    //   this.stopListening();
    //   // Reset Breadcrumbs
    //   var breadcrumbs = [ia.allPortfoliosPortfolio, model];

    //   Backbone.trigger('set:breadcrumbs', breadcrumbs);

    //   // Populate main layout
    //   var projectDetail = new Layouts.ProjectDetail({model: model});
    //   ia.layouts.app.mainContent.show(projectDetail);

    //   var map = new Project.views.map({
    //     collection: new Project.collections.Projects([model])
    //   });

    //   // Populate project detail view
    //   projectDetail.map.show(map);

    //   this.currentState = 'projectDetail';

    //   // Set up listeners
    //   this.listenTo(Backbone, 'select:portfolio', function(model){
    //     // Set address bar and force routing
    //     Backbone.history.navigate('/portfolio/' + model.get('id'), true);
    //   });

    //   this.listenTo(Backbone, 'select:project', function(model){
    //     // Set address bar
    //     Backbone.history.navigate('/project/' + model.get('id'));
    //   });
    // },

    // portfolioDashboard: function(model, collection){
    //   this.stopListening();

    //   var breadcrumbs = [ia.allPortfoliosPortfolio];
    //   Backbone.trigger('set:breadcrumbs', breadcrumbs);

    //   if (this.currentState !== 'portfolioDashboard') {
    //     var
    //       dashboardLayout = new Layouts.PortfolioDashboard(),
    //       projectList = model.get('projects').clone(),
    //       // Build primary portfolio nav
    //       portfolioNavigationListView = new Portfolio.views.NavigationListView({
    //         collection: collection,
    //         model: model
    //       }),
    //       dashboard = new Project.views.Dashboard({ collection: projectList })
    //     ;

    //     projectList.listenTo(Backbone, 'select:portfolio', function(model){
    //       // Update the collection.
    //       projectList.set(model.get('projects').models);
    //     });

    //     ia.layouts.app.mainContent.show(dashboardLayout);
    //     dashboardLayout.dashboard.show(dashboard);
    //     dashboardLayout.contentNavigation.show(portfolioNavigationListView);

    //     this.currentState = 'portfolioDashboard';
    //   } else {
    //     // Trigger select event - We may want to pull global event
    //     // listening out of the modules
    //     Backbone.trigger('select:portfolio', model);
    //   }

    //   this.listenTo(Backbone, 'select:portfolio', function(model){
    //     // Set address bar
    //     Backbone.history.navigate('/portfolio/dashboard/' + model.get('id'));
    //   });
    // },

    // profile: function(){
    //   console.log('profile', ia.currentUser);
    //   var profile = new Layouts.Profile({model: ia.currentUser});

    //   Backbone.trigger('set:breadcrumbs', {name: 'Profile'});

    //   ia.layouts.app.mainContent.show(profile);

    //   this.currentState = 'profile';
    // },

    onShow: function(){
      this.header.show(this.headerView);
      this.pageNavigation.show(this.breadcrumbsView);
    },

    initialize: function(app){
      this.app = app;

      // Build header
      this.headerView = new Layouts.Header({model: app.currentUser});
      // Build breadcrumbs
      var breadcrumbs = new Breadcrumb.collections.BreadcrumbList();
      this.breadcrumbsView = new Breadcrumb.views.Breadcrumbs({ collection: breadcrumbs });

      // Reset breadcrumbs
      // var breadcrumbs = [app.allPortfoliosPortfolio];

      // if (model !== app.allPortfoliosPortfolio) {
      //   breadcrumbs.push(model);
      // }

      // Backbone.trigger('set:breadcrumbs', breadcrumbs);
    }
  });
});
