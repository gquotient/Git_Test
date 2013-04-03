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
      // Build primary portfolios view
      this.portfolios( {collection: ia.allPortfolios, model: ia.allPortfoliosPortfolio } );
    },

    selectPortfolio: function(id){
      // Build custom portfolios view
      var model = ia.allPortfolios.get(id),
          collection = new Portfolio.collections.NavigationList(model.attributes.subPortfolios.models);

      this.portfolios( {collection: collection, model: model });
    },

    portfolios: function(options){
      console.log(options.collection);
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
        breadcrumbModels = [ia.allPortfoliosPortfolio],
        breadcrumbs,
        breadcrumbsView,
        detailOverview = new Layouts.detailOverview();

      if (options.model !== ia.allPortfoliosPortfolio) {
        breadcrumbModels.push(options.model);
      }

      breadcrumbs = new Portfolio.collections.BreadcrumbList(breadcrumbModels, {controller: portfolioController});
      breadcrumbsView = new Portfolio.views.Breadcrumbs({ collection: breadcrumbs, controller: portfolioController });

      // Populate main layout
      ia.layouts.app.contentNavigation.show(portfolioNavigationListView);
      ia.layouts.app.pageNavigation.show(breadcrumbsView);
      ia.layouts.app.mainContent.show(detailOverview);

      // Build detail view
      var
        // Build KPIs
        kpisView = new Portfolio.views.detailKpis({ model: options.model, controller: portfolioController }),
        // Prepare map
        map = new Project.views.map({
          controller: portfolioController,
          collection: ia.allProjects
        }),
        // Extend project collection and view to be used for portfolios. May be a better way to do this.
        portfolioProjectList = Project.views.DataList.extend({
          controller: portfolioController,
          initialize: function(){
            var that = this;

            this.listenTo(this.controller, 'select:portfolio', function(options){
              // Reset collection and re render
              that.collection = new Project.collections.DataList(options.model.get('projects'));
              that.render();
            });
          }
        }),
        projectList = new portfolioProjectList({collection: new Project.collections.DataList(options.model.get('projects'))});

      // Poulate detail layout
      detailOverview.kpis.show(kpisView);
      detailOverview.projects.show(projectList);
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
