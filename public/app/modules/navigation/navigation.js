define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.virtualCollection',

  './admin',

  'hbs!navigation/templates/list',
  'hbs!navigation/templates/listItem'
], function(
  $,
  _,
  Backbone,
  Marionette,
  VirtualCollection,

  adminViews,

  listTemplate,
  listItemTemplate
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
    ui: {
      list: '> ul'
    },
    className: 'navigationList',
    itemViewContainer: '> ul',
    itemView: Navigation.views.NavigationItemView,
    emptyView: Marionette.ItemView.extend({
      tagName: 'li',
      className: 'I-are-loading',
      template: _.template('<div class="loadingIndicator"></div>')
    }),
    activeFilter: {},
    onRender: function(){
      // Add slide in animation class
      this.ui.list.addClass('hidden');
    },
    onShow: function(){
      var that = this;

      // Triggers css transition by removing class
      var removeHidden = function(){
        that.ui.list.removeClass('hidden');
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

  _.extend(Navigation.views, adminViews);

  return Navigation;
});
