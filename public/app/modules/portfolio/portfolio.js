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
  'hbs!portfolio/templates/aggregateKpis',

  'hbs!portfolio/templates/filterGeneric',
  'hbs!portfolio/templates/filterACCapacity',
  'hbs!portfolio/templates/filterDCCapacity',
  'hbs!portfolio/templates/filterLatitude',
  'hbs!portfolio/templates/filterLongitude',
  'hbs!portfolio/templates/filterZipcode',
  'hbs!portfolio/templates/filterState',
  'hbs!portfolio/templates/filterOwner',
  'hbs!portfolio/templates/filterStatus'
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
  aggregateKpisTemplate,

  filterGenericTemplate,
  filterACCapacityTemplate,
  filterDCCapacityTemplate,
  filterLatitudeTemplate,
  filterLongitudeTemplate,
  filterZipcodeTemplate,
  filterStateTemplate,
  filterOwnerTemplate,
  filterStatusTemplate
){
  var Portfolio = { views: {} };

  Portfolio.Model = Backbone.Model.extend({
    idAttribute: 'portfolio_id',
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

      // Add projects to the collection
      this.updateProjects();

      // Update aggregate KPIs when projects update
      this.listenTo(this.projects, 'change', _.debounce(this.aggregateKpis, 500));

      this.listenTo(this.collection.projects, 'change', _.debounce(this.updateProjects, 500));
    },

    updateProjects: function(){
      // Clear out existing projects
      this.projects.reset();

      // If a projects array is returned from an old style filter,
      // add them to the collection
      _.each(this.get('projects'), function(project){
        project = this.collection.projects.get(project);

        if (project) {
          this.projects.add(project);
        }
      }, this);

      // If filter is a smart filter, fetch projects
      if (_.isArray(this.get('filter'))) {
        this.projects.add(this.filteredProjects());
      }

      this.set('total_projects', this.projects.length);

      this.aggregateKpis();
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
        data: this.toJSON()
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
          // Fuzzy eval because who knows if a given property is coming back
          // as a number or a string...
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

      this.on('add', function(portfolio, collection){
        portfolio.updateProjects();
      }, this);
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
    },
    initialize: function(){
      this.listenTo(this.model.projects, 'add', _.debounce(this.render, 500));
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
      'click .remove': 'close'
    },
    template: {
      type: 'handlebars',
      template: function(options){
        var filters = {
          generic: filterGenericTemplate,
          ac_capacity: filterACCapacityTemplate,
          dc_capacity: filterDCCapacityTemplate,
          latitude: filterLatitudeTemplate,
          longitude: filterLongitudeTemplate,
          zipcode: filterZipcodeTemplate,
          state: filterStateTemplate,
          owner: filterOwnerTemplate,
          status: filterStatusTemplate
        };

        return filters[options.property] ? filters[options.property](options) : filters.generic(options);
      }
    }
  });

  Portfolio.views.SingleEdit = Marionette.CompositeView.extend({
    template: {
      type: 'handlebars',
      template: editPortfolioTemplate
    },
    ui: {
      message: '.message',
      display_name: '#display_name',
      filterType: '#filterType'
    },
    triggers: {
      'click .save': 'save',
      'click .cancel': 'cancel',
      'click .addFilter': 'addFilter'
    },
    itemViewContainer: '.filters',
    itemView: Portfolio.views.Filter,
    initialize: function(){
      this.collection = new Backbone.Collection();
    },
    onAddFilter: function(){
      this.addFilter({property: this.ui.filterType.val()});
    },
    addFilter: function(filter){
      this.collection.add(new Backbone.Model(filter));
    },
    onRender: function(){
      var filters = this.model.get('filter');

      if (typeof filters === 'object' && filters.length) {
        // Build existing filters
        _.each(filters, this.addFilter, this);
      }
    },
    updateMessage: function(message, type) {
      // Remove existing status classes
      this.ui.message.removeClass('error warning ok');

      if (type) {
        this.ui.message.addClass(type);
      }

      if (message) {
        this.ui.message.text(message);
        this.ui.message.fadeIn();
      } else {
        this.ui.message.fadeOut();
      }
    },
    validate: function(portfolio){
      var that = this;

      var validateFilters = function(filters){
        if (!filters || !filters.length) {
          that.updateMessage('A filter is required', 'error');
          return false;
        } else {
          var hasValue = true;

          _.each(filters, function(filter){
            if (!filter.value.length) {
              hasValue = false;
            }
          });

          if (!hasValue) {
            that.updateMessage('All filters require a value', 'error');
            return false;
          }
        }

        return true;
      };

      if (!portfolio.display_name.length) {
        this.updateMessage('A name is required', 'error');
        this.ui.display_name.focus();
        return false;
      } else if (!validateFilters(portfolio.filter)) {
        return false;
      }

      return true;
    },
    onSave: function(){
      var portfolio = {
        display_name: this.ui.display_name.val(),
        filter: [],
        // Default to share for now until we figure out this whole concept a little better
        share: 'yes'//this.$('#share').attr('checked') ? 'yes' : 'no'
      };

      // NOTE - This can be cleaned up to use the actual collection of ItemViews
      $('.filter').each(function(index){
        var $this = $(this);

        portfolio.filter.push({
          property: $this.find('[name="property"]').val(),
          operator: $this.find('[name="operator"]').val(),
          value: $this.find('[name="value"]').val()
        });
      });

      // Run validation and save if it passes
      if (this.validate(portfolio)){
        var that = this;

        this.model.save(portfolio, {wait: true}).done(function(){
          that.updateMessage('Portfolio saved');
        });
      }
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
