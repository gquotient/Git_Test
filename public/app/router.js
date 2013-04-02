define([
  'jquery',
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',

  'ia',

  'user',
  'portfolio',
  'layouts'
],
function($, Backbone, Marionette, MarionetteHandlebars, ia, User, Portfolio, Layouts){

  ia.Controller = Backbone.Marionette.Controller.extend({
    index: function(){
      this.portfolios( {collection: ia.allPortfolios, model: ia.allPortfoliosPortfolio } );
    },

    portfolios: function(options){

      // Create the navigation view.
      var portfolioController = new Portfolio.controller({
        allPortfolios: ia.allPortfolios,
        allProjects: ia.allProjects
      }),
          portfolioNavigationListView = new Portfolio.views.NavigationListView({
            controller: portfolioController,
            collection: options.collection,
            model: options.model
          }),
          detailOverview = new Layouts.detailOverview( {controller: portfolioController, projectList: ia.allProjects} ),
          breadcrumbModels = [ia.allPortfoliosPortfolio],
          breadcrumbs,
          breadcrumbsView;

      if (options.model !== ia.allPortfoliosPortfolio) {
        breadcrumbModels.push(options.model);
      }
      breadcrumbs = new Portfolio.collections.BreadcrumbList(breadcrumbModels, {controller: portfolioController});
      breadcrumbsView = new Portfolio.views.Breadcrumbs({ collection: breadcrumbs, controller: portfolioController });
      // breadcrumbs = new Portfolio.views.breadcrumbs({controller: portfolioController})

      ia.layouts.app.contentNavigation.show(portfolioNavigationListView);
      ia.layouts.app.pageNavigation.show(breadcrumbsView);
      ia.layouts.app.mainContent.show(detailOverview);

      portfolioNavigationListView.setPortfolio();

    }
  });

    var Router = Backbone.Marionette.AppRouter.extend({
      controller: new ia.Controller(),
      appRoutes: {
        '': 'index',
        'portfolios': 'index'
      }
    });

    return Router;
  }
);
