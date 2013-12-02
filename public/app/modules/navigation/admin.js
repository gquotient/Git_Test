define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'hbs!navigation/templates/dropdown',
  'hbs!navigation/templates/dropdownItem',
  'hbs!navigation/templates/adminList',
  'hbs!navigation/templates/adminListItem'
], function(
  $,
  _,
  Backbone,
  Marionette,

  dropdownTemplate,
  dropdownItemTemplate,
  adminListTemplate,
  adminListItemTemplate
){
  var views = {};

  views.DropdownItem = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: dropdownItemTemplate
    },

    templateHelpers: function(){
      return {
        attribute: this.model.get('name')
      };
    },

    triggers: {
      'mousedown a': 'select'
    }
  });

  views.Dropdown = Marionette.CompositeView.extend({
    template: {
      type: 'handlebars',
      template: dropdownTemplate
    },

    className: 'dropdown',

    itemView: views.DropdownItem,
    itemViewContainer: 'ul',

    // Overwritten to render children on reset, filter and sort.
    _initialEvents: function(){
      if (this.collection) {
        this.listenTo(this.collection, 'add', this.addChildView, this);
        this.listenTo(this.collection, 'remove', this.removeItemView, this);
        this.listenTo(this.collection, 'reset filter sort', this._renderChildren, this);
      }
    },

    // Overwritten to repect the collection order when adding children.
    appendHtml: function(collectionView, itemView, index){
      var $container = this.getItemViewContainer(collectionView),
        children = $container.children();

      if (children.size() <= index) {
        $container.append(itemView.el);
      } else {
        children.eq(index).before(itemView.el);
      }
    }
  });

  views.AdminListItem = Marionette.ItemView.extend({
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

  views.AdminList = Marionette.CompositeView.extend({
    constructor: function(){
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);

      if (this.categories) {

        // Make categories into a backbone collection if array.
        if (_.isArray(this.categories)) {
          this.categories = new Backbone.Collection(this.categories);
        }

        this.createDropdown(this.categories);
      }

      this.on('itemview:detail', function(view){
        this.trigger('select', view.model);
      });
    },

    createDropdown: function(categories){
      var dropdown = new views.Dropdown({collection: categories});

      this.on('render', function(){
        this.ui.title.addClass('drop-filter');
        this.$el.append(dropdown.render().el);
      });

      this.on('click:title', function(){
        dropdown.$el.toggle();
      });

      this.listenTo(dropdown, 'itemview:select', function(view){
        dropdown.$el.hide();
        this.triggerMethod('change:category', view.model);
      });

      this.on('change:category', function(model){
        this.ui.title.html(model.get('name'));
      });
    },

    template: {
      type: 'handlebars',
      template: adminListTemplate
    },

    className: 'navigation-admin-list',

    itemView: views.AdminListItem,
    itemViewContainer: 'tbody',

    bindUIElements: function(){
      this.ui = this.ui || {};

      // Store a copy of the original ui object or function.
      if (!this._ui) { this._ui = this.ui; }

      // Combine the result of the original ui with admin list elements.
      this._uiBindings = _.extend({}, _.result(this, '_ui'), {
        title: '.title',
        refresh: '.refresh-icon'
      });

      Marionette.CompositeView.prototype.bindUIElements.apply(this, arguments);
    },

    configureTriggers: function(){
      this.triggers = this.triggers || {};

      // Store a copy of the original triggers object or function.
      if (!this._triggers) { this._triggers = this.triggers; }

      // Combine the result of the original triggers with admin list triggers.
      this.triggers = _.extend({}, _.result(this, '_triggers'), {
        'click .title': 'click:title',
        'click .refresh-icon': 'refresh'
      });

      return Marionette.CompositeView.prototype.configureTriggers.apply(this, arguments);
    },

    // Overwritten to render children on reset, filter and sort.
    _initialEvents: function(){
      if (this.collection) {
        this.listenTo(this.collection, 'add', this.addChildView, this);
        this.listenTo(this.collection, 'remove', this.removeItemView, this);
        this.listenTo(this.collection, 'reset filter sort', this._renderChildren, this);
      }
    },

    // Overwritten to repect the collection order when adding children.
    appendHtml: function(collectionView, itemView, index){
      var $container = this.getItemViewContainer(collectionView),
        children = $container.children();

      if (children.size() <= index) {
        $container.append(itemView.el);
      } else {
        children.eq(index).before(itemView.el);
      }
    },

    setActive: function(model){
      var view = model && this.children.findByModel(model);

      this.$('tr.active').removeClass('active');

      if (view) {
        view.$el.addClass('active');
      }
    },

    toggleRefresh: function(state){
      if (!this.isClosed) {
        this.ui.refresh.toggleClass('active', state === true);
      }
    }
  });

  return views;
});
