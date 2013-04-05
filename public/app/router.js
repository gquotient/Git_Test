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
      this.portfolios( { collection: new Portfolio.collections.NavigationList(ia.allPortfolios.models), model: ia.allPortfoliosPortfolio } );
    },

    selectPortfolio: function(id){
      // Build custom portfolios view
      var model = ia.allPortfolios.get(id),
          collection = model.get("subPortfolios");

      this.portfolios( {collection: collection, model: model });
    },

    portfolios: function(options){

      var
        // Build primary portfolio nav
        portfolioNavigationListView = new Portfolio.views.NavigationListView({
          collection: options.collection,
          model: options.model
        }),

        // Build breadcrums
        breadcrumbs = new Portfolio.collections.BreadcrumbList(_.unique([ia.allPortfoliosPortfolio, options.model])),
        breadcrumbsView = new Portfolio.views.Breadcrumbs({ collection: breadcrumbs }),
        detailOverview = new Layouts.detailOverview()
      ;

      // Populate main layout
      ia.layouts.app.contentNavigation.show(portfolioNavigationListView);
      ia.layouts.app.pageNavigation.show(breadcrumbsView);
      ia.layouts.app.mainContent.show(detailOverview);

      // Build detail view
      var
        // Build KPIs
        kpisView = new Portfolio.views.detailKpis({ model: options.model }),

        projectList = options.model.get('projects').clone();

        // Extend map view for marker filtering
        map = new Project.views.map({
          collection: projectList
        }),

        projectListView = new Project.views.DataListView( { collection: projectList } )
      ;

      // Poulate detail layout
      detailOverview.kpis.show(kpisView);
      detailOverview.projects.show(projectListView);
      detailOverview.map.show(map);

      // Fire build function since leaflet doens't fit nicely into the Backbone module pattern
      map.build();
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
