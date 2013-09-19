define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.virtualCollection',

  'hbs!navigation/templates/list',
  'hbs!navigation/templates/listItem',
  'hbs!navigation/templates/adminList',
  'hbs!navigation/templates/adminListItem',
  'hbs!navigation/templates/dropdown',
  'hbs!navigation/templates/dropdownItem'
], function(
  $,
  _,
  Backbone,
  Marionette,
  VirtualCollection,

  listTemplate,
  listItemTemplate,
  adminListTemplate,
  adminListItemTemplate,
  dropdownTemplate,
  dropdownItemTemplate
){
  var Navigation = { views: {} };

  Navigation.views.ListItem = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: listItemTemplate
    },
    className: 'nav-item',
    setActive: function(){
      this.$el.addClass('active');
    },
    events: {
      'click': function(){
        this.trigger('click', this.model);
      }
    }
  });

  Navigation.views.List = Marionette.CompositeView.extend({
    tagName: 'div',
    template: {
      type: 'handlebars',
      template: listTemplate
    },
    className: 'navigationList hidden',
    itemViewContainer: '> ul',
    itemView: Navigation.views.NavigationItemView,
    activeFilter: {},
    onShow: function(){
      var that = this;

      // Triggers css transition
      var removeHidden = function(){
        that.$el.removeClass('hidden');
      };

      setTimeout(removeHidden, 0);
    },
    sort: function(comparator){
      // Set new comparator on collection
      if (_.indexOf(comparator, '-') === 0) {
        // Remove minus
        comparator = comparator.slice(1);

        // Reverse sort
        this.collection.comparator = function(valueA, valueB){
          if (valueA.get(comparator) > valueB.get(comparator)){ return -1; }
          if (valueA.get(comparator) < valueB.get(comparator)){ return 1; }
          return 0;
        };
      } else {
        this.collection.comparator = comparator;
      }

      // Sort collection
      this.collection.sort();

      // Re-render only the child views
      this._renderChildren();
      // Reset the active el since render blows it away
      this.setActive(this.activeFilter);
    },
    setActive: function(options){
      if (!_.isObject(options)) {
        options = {id: options};
      }

      // Remove existing active class
      this.$('.active').removeClass('active');

      this.children.each(function(view){
        var active = _.all(options, function(value, key){
          var other = key === 'id' ? view.model.id : view.model.get(key);
          return value === other;
        });

        if (active) {
          view.setActive();
        }
      });

      this.activeFilter = options;
    },
    initialize: function(options){
      this.collection = new Backbone.VirtualCollection(options.collection, {
        close_with: this
      });
    }
  });

  Navigation.views.AdminListItem = Marionette.ItemView.extend({
    tagName: 'tr',
    template: {
      type: 'handlebars',
      template: adminListItemTemplate
    },

    triggers: {
      'click': 'detail',
      'click button.delete': 'delete'
    },

    modelEvents: {
      'change': 'render'
    },

    onDelete: function(){
      if (window.confirm('Are you sure you want to delete this item?')) {
        this.model.destroy({wait: true});
      }
    }
  });

  Navigation.views.AdminList = Marionette.CompositeView.extend({
    constructor: function(){
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);

      this.listenTo(this, 'itemview:detail', function(view){
        this.trigger('select', view.model);
      });
    },

    template: {
      type: 'handlebars',
      template: adminListTemplate
    },

    className: 'navigation-admin-list',

    itemView: Navigation.views.AdminListItem,
    itemViewContainer: 'tbody',

    ui: {
      refresh: '.refresh-icon',
      create: 'button.create',
      save: 'button.save',
      cancel: 'button.cancel'
    },

    triggers: {
      'click .refresh-icon': 'refresh',
      'click button.create': 'create',
      'click button.save': 'save',
      'click button.cancel': 'cancel'
    },

    onCreate: function(){
      this.trigger('select');
    },

    setActive: function(model, options){
      var view = model && this.children.findByModel(model);

      options = options || {};

      this.$('tr.active').removeClass('active');

      if (view) {
        view.$el.addClass('active');
      }

      this.ui.save.toggle(!!model && options.showSave !== false);
      this.ui.cancel.toggle(!!model);
    },

    toggleRefresh: function(state){
      this.ui.refresh.toggleClass('active', state === true);
    },

    toggleSaving: function(state){
      this.ui.save.toggleClass('loading-left', state === true);
    }
  });

  Navigation.views.DropdownItem = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: dropdownItemTemplate
    },

    triggers: {
      'mousedown a': 'select'
    }
  });

  Navigation.views.Dropdown = Marionette.CompositeView.extend({
    template: {
      type: 'handlebars',
      template: dropdownTemplate
    },

    className: 'dropdown',

    itemView: Navigation.views.DropdownItem,
    itemViewContainer: 'ul'
  });

  return Navigation;
});
