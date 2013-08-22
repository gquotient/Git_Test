define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'navigation',
  'project',
  'form',

  'hbs!portfolio/templates/navigationList',
  'hbs!portfolio/templates/navigationItem',
  'hbs!portfolio/templates/newPortfolio',
  'hbs!portfolio/templates/aggregateKpis'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Navigation,
  Project,
  Forms,

  navigationListTemplate,
  navigationItemTemplate,
  newPortfolioTemplate,
  aggregateKpisTemplate
){
  var Portfolio = { views: {} };

  Portfolio.Model = Backbone.Model.extend({
    defaults: {
      type: 'portfolio',

      total_projects: 0,

      dc_capacity: 0,
      ac_capacity: 0,
      irradiance_now: 0,
      power_now: 0
    },

    initialize: function(options){
      this.projects = new Project.Collection([], {comparator: 'display_name'});

      _.each(this.get('projects'), function(project){
        project = this.collection.projects.get(project);

        if (project) {
          this.projects.add(project);
        }
      }, this);

      this.set('total_projects', this.projects.length);
      this.aggregateKpis();
      this.listenTo(this.projects, 'change', this.aggregateKpis);
    },

    aggregateKpis: function(){
      var that = this,
        kpis = {
          dc_capacity: 0,
          ac_capacity: 0,
          irradiance_now: 0,
          power_now: 0
        };

      this.projects.each(function(project){
        var dc_capacity = project.get('dc_capacity'),
            ac_capacity = project.get('ac_capacity'),
            projectKpis = project.get('kpis');

        kpis.dc_capacity += (dc_capacity || 0);
        kpis.ac_capacity += (ac_capacity || 0);
        kpis.irradiance_now += (projectKpis.irradiance || 0);
        kpis.power_now += (projectKpis.power || 0);
      }, this);

      this.set(kpis);
    }
  }, {
    schema: {
      attributes: {
        'display_name': {
          type: 'text',
          title: 'Name',
          required: true
        }
      }
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
  Portfolio.views.NavigationItemView = Navigation.views.ListItem.extend({
    template: {
      type: 'handlebars',
      template: navigationItemTemplate
    },
    attributes: {
      class: 'nav-item'
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
      }
    }
  });

  /* This composite view is the wrapper view for the list of portfolios.
     It handles nesting the list while allowing for the navigation header. */
  Portfolio.views.NavigationListView = Navigation.views.List.extend({
    template: {
      type: 'handlebars',
      template: navigationListTemplate
    },
    // Tell the composite view which view to use as for each portfolio.
    itemView: Portfolio.views.NavigationItemView,

    events: {
      'change #portfolio-sort': function(event){
        this.sort(event.currentTarget.value);
      },
      'click #new-portfolio': function(){
        var newPortfolioView = new Portfolio.views.NewPortfolio({collection: this.options.collection});

        newPortfolioView.render();
        $('body').append(newPortfolioView.obscure);
        $('body').append(newPortfolioView.$el);

        newPortfolioView.$el.css({
          top: this.$el.offset().top,
          left: this.$el.offset().left + this.$el.width()
        }).removeClass('hidden');
      }
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
    modelEvents: {
      'change': 'render'
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
    obscure: $('<div class="obscure"></div>'),
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

        this.obscure.detach();
        this.close();
      },
      'click .close': function(e){
        this.obscure.detach();
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

  Portfolio.views.EditRow = Forms.views.tableRow.extend({

  });

  // Table CompositeView extended from form
  Portfolio.views.EditTable = Forms.views.table.extend({
    fields: ['display_name'],
    model: Portfolio.Model,
    actions: ['edit', 'delete']
  });

  return Portfolio;
});
