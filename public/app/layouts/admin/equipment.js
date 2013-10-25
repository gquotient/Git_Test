define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',

  'equipment',

  'hbs!layouts/admin/templates/equipment'
], function(
  _,
  $,
  Backbone,
  Marionette,

  Equipment,

  equipmentAdminTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: equipmentAdminTemplate
    },

    attributes: {
      id: 'page-equipmentAdmin'
    },

    regions: {
      list: '.equipment-list',
      detail: '.equipment-detail'
    },

    initialize: function(options){

      // Create the list view.
      this.listView = new Equipment.views.AdminList({
        collection: this.collection,
        current: options.current
      });

      this.listenTo(this.listView, 'refresh', this.refresh);
      this.listenTo(this.listView, 'select', this.showDetail);
      this.listenTo(this.listView, 'filter', function(filters){
        if (!_.isEqual(this.equipFilters, filters)) {
          this.equipFilters = filters;
          this.showDetail();
        }
      });
    },

    triggers: {
      'click button.create': 'create'
    },

    onShow: function(){
      this.list.show(this.listView);

      // Update the collection by triggering a refresh.
      this.refresh({
        success: _.bind(function(){
          var current = this.collection.get(this.options.current);

          if (current) {
            this.showDetail(current);
          }
        }, this)
      });
    },

    onCreate: function(){
      this.showDetail();
    },

    refresh: function(options){
      options = options || {};

      this.listView.toggleRefresh(true);

      this.collection.fetch({
        success: options.success,
        complete: _.bind(function(){
          this.listView.toggleRefresh(false);
        }, this)
      });
    },

    showDetail: function(model){
      var view;

      if (!(model instanceof Backbone.Model)) {
        model = new Equipment.Model(model, {
          collection: this.collection,
          user: this.options.user,
          silent: false
        });
      }

      view = new Equipment.views.AdminDetail({
        collection: this.collection,
        filters: this.equipFilters,
        model: model
      });

      this.listenTo(view, 'save:success', function(){
        this.collection.add(model);
        this.showDetail(model);
      });

      this.listenToOnce(view, 'close', function(){
        if (!this.listView.isClosed) {
          this.listView.setActive();
        }

        this.model = null;
      });

      this.detail.show(view);
      this.listView.setActive(model);
      this.model = model;
    }
  });
});
