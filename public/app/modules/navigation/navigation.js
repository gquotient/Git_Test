define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!navigation/templates/list',
  'hbs!navigation/templates/listItem'
], function(
  $,
  _,
  Backbone,
  Marionette,

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
      this.collection.comparator = comparator;
      // Sort collection
      this.collection.sort();
      // Re-render only the child views
      this._renderChildren();
      // Reset the active el since render blows it away
      this.setActive(this.activeFilter);
    },
    setActive: function(options){
      var property, value;

      // If options is a string or number, assume it's an id
      // else, it's a hash with an arbitrary property
      if (typeof options === 'string' || typeof options === 'number') {
        property = 'id';
        value = options;
      } else if (typeof options === 'object') {
        for (var name in options) {
          property = name;
          value = options[name];
        }
      }

      // Remove existing active class
      this.$('.active').removeClass('active');

      // Find view with matching model
      this.children.each(function(view){
        if (property === 'id') {
          if (view.model.id === value) {
            view.setActive();
          }
        } else if (view.model.get(property) === value) {
          view.setActive();
        }
      });

      // Store the current active state in case of sorting or similar event
      this.activeFilter[property] = value;
    }
  });

  return Navigation;
});
