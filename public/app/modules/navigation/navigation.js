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

  Navigation.views.ListItemView = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: listItemTemplate
    },
    attributes: {
      class: 'nav-item'
    },
    events: {
      'click': function(){
        this.trigger('click', this.model);
      }
    }
  });

  Navigation.views.ListView = Marionette.CompositeView.extend({
    tagName: 'div',
    attributes: {
      class: 'navigationList'
    },
    template: {
      type: 'handlebars',
      template: listTemplate
    },
    itemViewContainer: '> ul',
    itemView: Navigation.views.NavigationItemView,
    active: {},
    sort: function(comparator){
      // Set new comparator on collection
      this.collection.comparator = comparator;
      // Sort collection
      this.collection.sort();
      // Re-render only the child views
      this._renderChildren();
      // Reset the active el since render blows it away
      this.setActive(this.active);
    },
    setActive: function(options){
      var property, value;

      // If options is a string, assume it's an id
      // else, it's a hash with an arbitrary property
      if (typeof options === 'string') {
        property = 'id';
        value = options;
      } else if (typeof options === 'object') {
        for (var name in options) {
          property = name;
          value = options[name];
        }
      }

      // Remove existing active class
      this.$el.find('.active').removeClass('active');

      // Find view with matching model
      this.children.each(function(view){
        if (property === 'id') {
          if (view.model.id === value) {
            view.$el.addClass('active');
          }
        } else if (view.model.get(property) === value) {
          view.$el.addClass('active');
        }
      });

      // Store the current active state in case of sorting or similar event
      this.active[property] = value;
    }
  });

  return Navigation;
});
