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
  'hbs!portfolio/templates/editPortfolio',
  'hbs!portfolio/templates/filter',
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
  editPortfolioTemplate,
  filterTemplate,
  aggregateKpisTemplate
){
  var Portfolio = { views: {} };

  Portfolio.Model = Backbone.Model.extend({
    url: '/api/portfolios',
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

      // Parse filter if it's one defined by the client side
      if (this.get('filter') && this.get('filter').charAt(0) === '[') {
        this.set('filter', JSON.parse(this.get('filter')));

        // Get filtered project list and add them to collection
        this.projects.add(this.filteredProjects());
      }

      this.set('total_projects', this.projects.length);
      this.aggregateKpis();
      this.listenTo(this.projects, 'change', this.aggregateKpis);
    },

    destroy: function(options) {
      var model = this;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      return $.ajax({
        url: this.url,
        type: 'DELETE',
        dataType: 'json',
        data: {
          portfolio_id: this.id
        }
      })
      .done(destroy);
    },

    filteredProjects: function(){
      var projects = [];
      var operation = {
        '>': function(val1, val2) {
          return val1 > val2;
        },
        '<': function(val1, val2) {
          return val1 < val2;
        },
        '=': function(val1, val2) {
          return val1 == val2;
        }
      };


      this.collection.projects.each(function(project){
        var match = true;

        _.each(this.get('filter'), function(filter){
          // Once match is set to false, don't run any more
          // NOTE - This will have to be smarter to handle both and/or cases
          if (match) {
            match = operation[filter.operator](project.get(filter.property), filter.value);
          }
        });

        if (match) {
          projects.push(project);
        }
      }, this);

      return projects;
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
        Backbone.history.navigate('/admin/portfolios/new', true);
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

  Portfolio.views.Filter = Marionette.ItemView.extend({
    tagName: 'li',
    className: 'filter',
    events: {
      'click .remove': function(event){
        this.close();
      }
    },
    template: {
      type: 'handlebars',
      template: filterTemplate
    }
  });

  Portfolio.views.SingleEdit = Marionette.CompositeView.extend({
    template: {
      type: 'handlebars',
      template: editPortfolioTemplate
    },
    triggers: {
      'click .save': 'save',
      'click .cancel': 'cancel',
      'click .addFilter': 'addFilter'
    },
    onAddFilter: function(){
      this.addFilter({});
    },
    itemViewContainer: '.filters',
    itemView: Portfolio.views.Filter,
    addFilter: function(filter){
      this.collection.add(new Backbone.Model(filter));
    },
    onRender: function(){
      var filters = this.model.get('filter');

      if (filters && filters.length) {
        // Build existing filters
        _.each(filters, function(filter){
          this.addFilter(filter);
        }, this);
      } else {
        //handle new
        this.addFilter({});
      }
    },
    updateMessage: function(message) {
      var $message = this.$('.message');

      if (message) {
        $message.show();
        $message.text(message);
      } else {
        $message.hide();
      }
    },
    validate: function(portfolio){
      var validateFilters = function(filter){
        console.log('filter', filter);

        if (!filter && !filter.length) {
          this.updateMessage('A filter is required');
          return false;
        }

        return true;
      };

      if (!portfolio.display_name.length) {
        this.updateMessage('A name is required');
        $('#display_name').focus();
        return false;
      } else if (!validateFilters(portfolio.filter)) {
        return false;
      }

      return true;
    },
    onSave: function(){
      var portfolio = {
        display_name: this.$('#display_name').val(),
        filter: [],
        share: this.$('#share').attr('checked') ? 'yes' : 'no'
      };

      $('.filter').each(function(index){
        var $this = $(this);

        portfolio.filter.push({
          property: $this.find('[name="property"]').val(),
          operator: $this.find('[name="operator"]').val(),
          value: $this.find('[name="value"]').val()
        });
      });

      // Stringify filter for the API
      portfolio.filter = JSON.stringify(portfolio.filter);

      if(this.validate(portfolio)){
        console.log('portfolio looks good', portfolio);
        this.updateMessage();

        this.model.save(portfolio).done(function(){
          console.log(arguments);
        });
      } else {
        console.log('portfolio needs fixed', portfolio);
      }
    },
    initialize: function(){
      this.collection = new Backbone.Collection();
    }
  });

  // Table CompositeView extended from form
  Portfolio.views.EditTable = Forms.views.table.extend({
    fields: ['display_name'],
    model: Portfolio.Model,
    actions: ['edit', 'delete']
  });

  return Portfolio;
});
