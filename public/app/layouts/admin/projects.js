define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',

  'project',
  'form',

  'hbs!layouts/admin/templates/projects'
], function(
  _,
  $,
  Backbone,
  Marionette,

  Project,
  Form,

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
      var collection = new Form.util.Collection(options.collection, {
        comparator: function(model){
          // Put newer projects toward the top.
          return (model.get('node_id') || Infinity) * -1;
        },
        close_with: this
      });

      // Create the list view.
      this.listView = new Project.views.AdminList({
        collection: collection
      });

      this.listenTo(this.listView, 'filter', function(filter){
        collection.updateFilter(function(project){
          return _.all(filter, function(criteria, key){
            var value = project.get(key);

            if (_.isArray(criteria)) {
              return _.contains(criteria, value);
            } else {
              return value === criteria;
            }
          });
        });
      });
      this.listenTo(this.listView, 'refresh', this.refresh);
      this.listenTo(this.listView, 'select', this.showDetail);

      // Create the map view.
      this.mapView = new Project.views.AdminMap({
        collection: collection
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
      this.refresh().done(_.bind(function(){
        var project = this.collection.get(this.options.current);

        if (project) {
          this.showDetail(project);
        } else {
          this.mapView.centerMap();
        }

        this.checkImporting();
      }, this));
    },

    onCreate: function(){
      this.showDetail();
    },

    refresh: function(){
      var listView = this.listView;

      listView.toggleRefresh(true);
      return this.collection.fetchFromAllIndices()
      .always(function(){
        listView.toggleRefresh(false);
      });
    },

    checkImporting: function(){
      var that = this;

      clearTimeout(this.importTimeout);

      // If the layout is still visible fetch importing projects.
      if (!this.isClosed) {
        this.collection.fetchImporting().done(function(){
          var interval = 60 * 1000;

          // If any projects are currently importing increase the poll rate.
          if (that.collection.any(function(m){ return m.isImporting(); })) {
            interval /= 10;
          }

          that.importTimeout = setTimeout(function(){
            that.checkImporting();
          }, interval);
        });
      }
    },

    showDetail: function(model){
      var view;

      if (!(model instanceof Backbone.Model)) {
        model = new Project.AdminModel(_.extend({
          index_name: 'AlignedProjects'
        }, model), {
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

      this.listenTo(view, 'import:started', function(){
        var that = this;

        clearTimeout(this.importTimeout);

        // Wait a second then check the status of the import.
        this.importTimeout = setTimeout(function(){
          that.checkImporting();
        }, 1000);
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
