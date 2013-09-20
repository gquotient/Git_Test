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
      this.listenTo(this.listView, 'save', this.saveDetail);
      this.listenTo(this.listView, 'cancel', this.hideDetail);

      // Create the map view.
      this.mapView = new Project.views.AdminMap({
        collection: this.collection
      });

      this.listenTo(this.mapView, 'select', this.showDetail);
      this.listenTo(this.mapView, 'locate', this.updateLocation);

      // Update breadcrumbs
      Backbone.trigger('reset:breadcrumbs', {
        state:'admin',
        display_name: 'Admin',
        url: '/admin'
      });

      Backbone.trigger('set:breadcrumbs', {
        state:'projects',
        display_name:'Projects',
        url: '/admin/projects'
      });

      // Update history
      Backbone.history.navigate('/admin/projects');
    },

    onShow: function(){
      this.list.show(this.listView);
      this.map.show(this.mapView);

      // Update the collection by triggering a refresh.
      this.refresh({
        success: _.bind(function(){
          var current = this.collection.get(this.options.current);

          if (current) {
            this.showDetail(current);
          }

          this.mapView.centerMap();
        }, this)
      });
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

      this.listenToOnce(view, 'close', function(){
        if (!this.collection.contains(model)) {
          this.mapView.removeMarker(model);
        }

        if (!this.listView.isClosed) {
          this.listView.setActive();
        }

        this.model = null;
        Backbone.history.navigate('/admin/projects');
      });

      this.detail.show(view);

      this.listView.setActive(model, {
        showSave: model.isEditable() || !model.isLocked()
      });
      this.mapView.focusMap(model);

      this.model = model;

      if (model.id) {
        Backbone.history.navigate('/admin/projects/' + model.id);
      }
    },

    saveDetail: function(){
      var detailView = this.detail.currentView,
        model = this.model,
        values;

      if (detailView && detailView.isValid()) {
        this.listView.toggleSaving(true);

        values = _.clone(detailView.changed);

        if (model.isNew()) {
          values.notes = model.formatNote('created project');
        }

        model.save(values, {
          success: _.bind(function(){
            this.collection.add(model);
            this.showDetail(model);
          }, this),
          complete: _.bind(function(){
            this.listView.toggleSaving(false);
          }, this)
        });
      }
    },

    hideDetail: function(){
      this.detail.close();
    },

    updateLocation: function(attr, model){
      if (!this.model) {
        this.showDetail(attr);

      } else if (this.model.isNew() && (!model || model === this.model)) {
        this.model.set(attr);

      } else {
        this.mapView.focusMap(attr);
      }
    }
  });
});
