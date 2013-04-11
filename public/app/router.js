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
      console.log('index');
      this.select_portfolio();
      Backbone.history.navigate('portfolio/all');
    },

    select_portfolio: function(id){
      console.log('selectPortfolio', id);
      var portfolio, subPortfolios;

      if (id && id !== 'all') {
        // Build custom portfolios view
        portfolio = ia.allPortfolios.get(id);
        subPortfolios = portfolio.get("subPortfolios");
      } else {
        // Build primary portfolios view
        portfolio = ia.allPortfoliosPortfolio;
        subPortfolios = new Portfolio.collections.NavigationList(ia.allPortfolios.models);
      }

      this.portfolio( { collection: subPortfolios, model: portfolio } );
    },

    portfolio: function(options){
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

      this.update_breadcrumbs(breadcrumbs);

      // Poulate detail layout
      portfolioDetail.kpis.show(kpisView);
      portfolioDetail.projects.show(projectListView);
      portfolioDetail.map.show(map);

      // Fire build function since leaflet doens't fit nicely into the Backbone module pattern
      map.build();

      this.currentState = 'portfolio';
    },

    select_project: function(id){
      console.log('selectProject', id);
      this.project({model: ia.allProjects.get(id)});
    },

    project: function(options){
      var projectDetail = new Layouts.ProjectDetail();

      // Reset Breadcrumbs
      var breadcrumbs = [ia.allPortfoliosPortfolio];

      breadcrumbs.push(options.model);

      this.update_breadcrumbs(breadcrumbs);

      // Populate main layout
      ia.layouts.app.contentNavigation.close();
      ia.layouts.app.mainContent.show(projectDetail);

      this.currentState = 'project';
    },

    update_breadcrumbs: function(models){
      // This is simple-minded but I have a feeling this abstraction will end up being useful
      Backbone.trigger('set:breadcrumbs', models);
    },

    initialize: function(){
      var that = this;

      this.listenTo(Backbone, 'select', function(model){
        // Set address bar
        Backbone.history.navigate('/' + model.get('type') + '/' + model.get('id'));

        // Build the page type if not already built
        if (that.currentState !== model.get('type')) {
          console.log('types don\'t match');
          that['select_' + model.get('type')](model.get('id'));
        }
      });
    }
  });

  var Router = Backbone.Marionette.AppRouter.extend({
    controller: new ia.Controller(),
    appRoutes: {
      '': 'index',
      'portfolio': 'index',
      'portfolio/:id': 'select_portfolio',
      'project': 'project',
      'project/:id': 'select_project'
    }
  });

  return Router;

});
