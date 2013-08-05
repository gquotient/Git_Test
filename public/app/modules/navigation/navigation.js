define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.virtualCollection',

  'hbs!navigation/templates/list',
  'hbs!navigation/templates/listItem'
], function(
  $,
  _,
  Backbone,
  Marionette,
  VirtualCollection,

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
    },
    initialize: function(options){
      this.collection = new Backbone.VirtualCollection(options.collection);

      // This is need to kill listeners
      this.collection.closeWith(this);
    }
  });

  return Navigation;
});
