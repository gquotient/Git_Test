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
    currentState: 'index',
    index: function(){
      // Build primary portfolios view
      this.portfolios( { collection: new Portfolio.collections.NavigationList(ia.allPortfolios.models), model: ia.allPortfoliosPortfolio } );
    },

    selectPortfolio: function(id){
      // Build custom portfolios view
      var portfolio = ia.allPortfolios.get(id),
          subPortfolios = portfolio.get("subPortfolios");

      this.portfolios( {collection: subPortfolios, model: portfolio });
    },

    portfolios: function(options){
      var
        // Build primary portfolio nav
        portfolioNavigationListView = new Portfolio.views.NavigationListView({
          collection: options.collection,
          model: options.model
        }),

        portfolioDetail = new Layouts.PortfolioDetail()
      ;

      // Populate main layout
      ia.layouts.app.contentNavigation.show(portfolioNavigationListView);
      ia.layouts.app.mainContent.show(portfolioDetail);

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


      // Reset Breadcrumbs
      var breadcrumbs = [ia.allPortfoliosPortfolio];

      if (options.model !== ia.allPortfoliosPortfolio) {
        breadcrumbs.push(options.model);
      }

      Backbone.trigger('set:breadcrumbs', breadcrumbs);

      // Poulate detail layout
      portfolioDetail.kpis.show(kpisView);
      portfolioDetail.projects.show(projectListView);
      portfolioDetail.map.show(map);

      // Fire build function since leaflet doens't fit nicely into the Backbone module pattern
      map.build();

      this.currentState = 'portfolios';
    },
    selectProject: function(id){
      console.log('selectProject', id);
      this.projects({model: ia.allProjects.get(id)});
    },
    projects: function(options){
      var projectDetail = new Layouts.ProjectDetail();

      // Populate main layout
      ia.layouts.app.contentNavigation.close();
      ia.layouts.app.mainContent.show(projectDetail);

      this.currentState = 'projects';
    },
    initialize: function(){
      var that = this;

      this.listenTo(Backbone, 'select:portfolio', function(model){
        if(model.get('id')){
          // Update the address bar to reflect the new model.
          Backbone.history.navigate('portfolios/'+ model.get('id'));
        } else {
          Backbone.history.navigate('/');
        }

        if (that.currentState !== 'portfolios') {
          that.selectPortfolio(model.get('id'));
        }
      });

      this.listenTo(Backbone, 'select:project', function(model){
        Backbone.history.navigate('projects/'+ model.get('id'));

        if (that.currentState !== 'projects') {
          that.selectProject(model.get('id'));
        }
      });
    }
  });

    var Router = Backbone.Marionette.AppRouter.extend({
      controller: new ia.Controller(),
      appRoutes: {
        '': 'index',
        'portfolios': 'index',
        'portfolios/:id': 'selectPortfolio',
        'projects': 'projects',
        'projects/:id': 'selectProject'
      }
    });

    return Router;
  }
);
