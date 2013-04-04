define([
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',

  'ia',

  'user',
  'portfolio',
  'project',
  'layouts'
],
function(_, Backbone, Marionette, MarionetteHandlebars, ia, User, Portfolio, Project, Layouts){

  ia.Controller = Backbone.Marionette.Controller.extend({
    index: function(){
      // Build primary portfolios view
      this.portfolios( { collection: ia.allPortfolios, model: ia.allPortfoliosPortfolio } );
    },

    selectPortfolio: function(id){
      // Build custom portfolios view
      var model = ia.allPortfolios.get(id),
          collection = model.get("subPortfolios");

      this.portfolios( {collection: collection, model: model });
    },

    portfolios: function(options){

      var
        // Build portfolio controller
        portfolioController = new Portfolio.controller({
          allPortfolios: ia.allPortfolios,
          allProjects: ia.allProjects
        }),
        // Build primary portfolio nav
        portfolioNavigationListView = new Portfolio.views.NavigationListView({
          controller: portfolioController,
          collection: options.collection,
          model: options.model
        }),

        // Build breadcrums
        breadcrumbs = new Portfolio.collections.BreadcrumbList(_.unique([ia.allPortfoliosPortfolio, options.model]), {controller: portfolioController}),
        breadcrumbsView = new Portfolio.views.Breadcrumbs({ collection: breadcrumbs, controller: portfolioController }),
        detailOverview = new Layouts.detailOverview();

      // Populate main layout
      ia.layouts.app.contentNavigation.show(portfolioNavigationListView);
      ia.layouts.app.pageNavigation.show(breadcrumbsView);
      ia.layouts.app.mainContent.show(detailOverview);

      // Build detail view
      var
        // Build KPIs
        kpisView = new Portfolio.views.detailKpis({ model: options.model, controller: portfolioController }),

        // Extend map view for marker filtering
        map = new Project.views.map({
          controller: portfolioController,
          collection: ia.allProjects
        }),
        projectList = options.model.get('projects');
        projectListView = new Project.views.DataList( { controller: portfolioController, collection: projectList } );

      // Poulate detail layout
      detailOverview.kpis.show(kpisView);
      detailOverview.projects.show(projectListView);
      detailOverview.map.show(map);

      // Fire build function since leaflet doens't fit nicely into the Backbone module pattern
      map
        .build()
        // Then we can hide the appropriate markers in case page start isn't index
        .hideMarkers(options.model.get('projects').models);
    }
  });

    var Router = Backbone.Marionette.AppRouter.extend({
      controller: new ia.Controller(),
      appRoutes: {
        '': 'index',
        'portfolios': 'index',
        'portfolios/:id': 'selectPortfolio'
      }
    });

    return Router;
  }
);
