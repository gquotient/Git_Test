define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',

  'project',

  'hbs!layouts/admin/templates/projects'
], function(
  _,
  $,
  Backbone,
  Marionette,

  Project,

  projectsAdminTemplate
){
  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: projectsAdminTemplate
    },

    attributes: {
      id: 'page-projectsAdmin'
    },

    regions: {
      list: '.project-list',
      detail: '.project-detail',
      map: '.project-map'
    },

    initialize: function(options){

      // Create the list view.
      this.listView = new Project.views.AdminList({
        collection: this.collection
      });

      this.listenTo(this.listView, 'refresh', this.refresh);
      this.listenTo(this.listView, 'select', this.showDetail);

      // Create the map view.
      this.mapView = new Project.views.AdminMap({
        collection: this.collection
      });

      this.listenTo(this.mapView, 'select', this.showDetail);
      this.listenTo(this.mapView, 'locate', this.updateLocation);
    },

    triggers: {
      'click button.create': 'create'
    },

    onShow: function(){
      this.list.show(this.listView);
      this.map.show(this.mapView);
      this.showDetail();

      // Update the collection by triggering a refresh.
      this.refresh({
        success: _.bind(function(){
          var current = this.collection.get(this.options.current);

          if (current) {
            this.showDetail(current);
          } else {
            this.mapView.centerMap();
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
        user: this.options.user,
        data: {
          index_name: 'AlignedProjects'
        },
        success: options.success,
        complete: _.bind(function(){
          this.listView.toggleRefresh(false);
        }, this)
      });
    },

    showDetail: function(model){
      var view;

      if (!(model instanceof Backbone.Model)) {
        model = new Project.Model(model, {
          collection: this.collection,
          user: this.options.user,
          silent: false
        });

        this.mapView.addMarker(model);
      }

      view = new Project.views.AdminDetail({
        collection: this.collection,
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

        if (!this.collection.contains(model)) {
          this.mapView.removeMarker(model);
        }

        this.model = null;
      });

      this.detail.show(view);
      this.listView.setActive(model);
      this.mapView.focusMap(model);
      this.model = model;
    },

    updateLocation: function(attr, model){
      if (this.model) {

        // Update the location for new models.
        if (this.model.isNew()) { this.model.set(attr); }

        // Make sure this model has a map marker.
        if (!model) { this.mapView.addMarker(this.model); }
      }

      this.mapView.focusMap(attr);
    }
  });
});
