define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'project',

  'hbs!portfolio/templates/navigationList',
  'hbs!portfolio/templates/navigationItem',
  'hbs!portfolio/templates/newPortfolio',
  'hbs!portfolio/templates/aggregateKpis'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Project,

  navigationListTemplate,
  navigationItemTemplate,
  newPortfolioTemplate,
  aggregateKpisTemplate
){
  var Portfolio = { views: {} };

  Portfolio.Model = Backbone.Model.extend({
    defaults: {
      type: 'portfolio',

      total_portfolios: 0,
      total_projects: 0,

      dc_capacity: 0,
      ac_capacity: 0,
      irradiance_now: 0,
      power_now: 0
    },

    kpis: ['dc_capacity', 'ac_capacity'],

    initialize: function(options){
      this.projects = new Project.Collection([], {comparator: 'display_name'});

      _.each(this.get('projects'), function(project){
        project = this.collection.projects.get(project);

        if (project) {
          this.projects.add(project);
        }
      }, this);

      this.set('total_projects', this.projects.length);
      this.set(this.aggregateKpis());
    },

    aggregateKpis: function(){
      var that = this;

      return this.projects.reduce(function(memo, project){
        _.each(that.kpis, function(kpi){
          var value = project.get(kpi) || 0;

          memo[kpi] = (memo[kpi] || 0) + value;
        });

        return memo;
      }, {});
    }
  });

  Portfolio.Collection = Backbone.Collection.extend({
    model: Portfolio.Model,
    url: '/api/portfolios',
    initialize: function(models, options){
      this.projects = options.projects;
    }

    // comparator: 'display_name'
  });

  /* The item view is the view for the individual portfolios in the navigation. */
  Portfolio.views.NavigationItemView = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: navigationItemTemplate
    },
    attributes: {
      class: 'nav-item hidden'
    },
    onRender: function(){
      var that = this;
      setTimeout(function(){ that.$el.removeClass('hidden'); }, 0);
    },
    onBeforeClose: function(){
      this.$el.removeClass('hidden');
    },
    events: {
      'mouseover': function(){
        Backbone.trigger('mouseover:portfolio', this.model);
      },
      'mouseout': function(){
        Backbone.trigger('mouseout:portfolio', this.model);
      },
      'click': function(){
        Backbone.trigger('click:portfolio', this.model);
      },
      'dblclick': function(){
        Backbone.trigger('select:portfolio', this.model);
      }
    }
  });

  /* This composite view is the wrapper view for the list of portfolios.
     It handles nesting the list while allowing for the navigation header. */
  Portfolio.views.NavigationListView = Marionette.CompositeView.extend({
    tagName: 'div',
    attributes: {
      class: 'portfolios'
    },
    template: {
      type: 'handlebars',
      template: navigationListTemplate
    },

    itemViewContainer: '.portfolio-list',

    // Tell the composite view which view to use as for each portfolio.
    itemView: Portfolio.views.NavigationItemView,

    events: {
      'change #portfolio-sort': function(){
        this.collection.comparator = $('#portfolio-sort').val();
        this.collection.sort();
      },
      'click #new-portfolio': function(){
        var newPortfolioView = new Portfolio.views.NewPortfolio({collection: this.collection});
        $('body').append(newPortfolioView.$el);
        newPortfolioView.render();
        newPortfolioView.$el.css({
          top: this.$el.offset().top,
          left: this.$el.offset().left + this.$el.width()
        }).removeClass('hidden');
      }
    },

    initialize: function(options){
      this.listenTo(Backbone, 'select:portfolio', this.setPortfolio);
      this.listenTo(this.collection, 'sort', this._renderChildren);
    },

    // onRender: function(){
    //   // Handle if no sub portfolios exist
    //   if (this.collection.length === 0) {
    //     this.$el.append('<li class="empty">No sub portfolios</li>');
    //   }
    // },

    // Setup the views for the current model.
    setPortfolio: function(model){
      // Set the current collection to be a new navigation list with the subPortfolios.
      this.collection = model.portfolios;

      // Trigger a render. This forces the nav header to update, too.
      this.render();
    },
    serializeData: function(){
      return '{sort_order:'+ this.collection.sort_order+'}';
    }
  });

  Portfolio.views.AggregateKpis = Marionette.ItemView.extend({
    tagName: 'ul',
    template: {
      type: 'handlebars',
      template: aggregateKpisTemplate
    },
    initialize: function(options){
      var that = this;

      this.listenTo(Backbone, 'select:portfolio', function(model){
        that.model = model;

        that.render();
      });
    }
  });

  Portfolio.views.NewPortfolio = Marionette.ItemView.extend({
    attributes: {
      class: 'modal new-portfolio hidden'
    },
    template: {
      type: 'handlebars',
      template: newPortfolioTemplate
    },
    events: {
      'click button': function(e){
        e.preventDefault();
        var that = this,
            share = this.$el.find('input[name=share]:checked');

        this.collection.create({
          display_name: this.$el.find('input[name=dName]').val(),
          filter: this.$el.find('input[name=filter]').val(),
          share: share.val()
        });

        this.close();
      },
      'click .close': function(e){
        this.close();
      }
    },
    remove: function(){
      var that = this;

      this.stopListening();
      this.$el.addClass('hidden');

      setTimeout(function(){ that.$el.remove(); }, 250);

    }
  });

  return Portfolio;
});
