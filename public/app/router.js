define([
  'jquery',
  'backbone',
  'backbone.marionette',
  'backbone.marionette.handlebars',

  'ia',

  'user',
  'portfolio',
  'project',
  'layouts'
],
function($, Backbone, Marionette, MarionetteHandlebars, ia, User, Portfolio, Project, Layouts){

  ia.Controller = Backbone.Marionette.Controller.extend({
    index: function(){
      this.portfolios( {collection: ia.allPortfolios, model: ia.allPortfoliosPortfolio } );
    },

    selectPortfolio: function(id){
      var model = ia.allPortfolios.get(id),
          collection = new Portfolio.collections.NavigationList(model.get('subPortfolios'));

      this.portfolios( {collection: collection, model: model });
    },

    portfolios: function(options){
      console.log('all projects', ia.allProjects);
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

          breadcrumbModels = [ia.allPortfoliosPortfolio],
          breadcrumbs,
          breadcrumbsView,
          detailOverview = new Layouts.detailOverview();

      if (options.model !== ia.allPortfoliosPortfolio) {
        breadcrumbModels.push(options.model);
      }
      breadcrumbs = new Portfolio.collections.BreadcrumbList(breadcrumbModels, {controller: portfolioController});
      breadcrumbsView = new Portfolio.views.Breadcrumbs({ collection: breadcrumbs, controller: portfolioController });
      // breadcrumbs = new Portfolio.views.breadcrumbs({controller: portfolioController})

      ia.layouts.app.contentNavigation.show(portfolioNavigationListView);
      ia.layouts.app.pageNavigation.show(breadcrumbsView);
      ia.layouts.app.mainContent.show(detailOverview);

      // Build detail view
      var kpisView = new Portfolio.views.detailKpis({ model: options.model, controller: portfolioController }),
          map = new Portfolio.views.map({ controller: portfolioController }),
          // Extend project collection to be used for portfolios. May be a better way to do this.
          portfolioProjectList = Project.views.DataList.extend({
            controller: portfolioController,
            initialize: function(){
              var that = this;
              console.log('project list', this);
              this.listenTo(this.controller, 'select:portfolio', function(options){
                console.log('project list heard select:portfolio', options.model.get('projectIDs'));
              });
            }
          }),
          projectList = new portfolioProjectList({collection: ia.allProjects});

      detailOverview.kpis.show(kpisView);
      detailOverview.map.show(map);
      // Fire build function since leaflet doens't fit nicely into the Backbone module pattern
      map.build();
      detailOverview.projects.show(projectList);

      portfolioNavigationListView.setPortfolio();
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
