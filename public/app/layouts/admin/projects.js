define([
  'underscore',
  'jquery',
  'backbone',
  'backbone.marionette',

  'leaflet',
  'css!leaflet.css',

  'project',

  'hbs!layouts/admin/templates/projects'
], function(
  _,
  $,
  Backbone,
  Marionette,

  L,
  leafletCSS,

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

    ui: {
      map: '.map',
      refresh: '.refresh-icon',
      save: 'button.save',
      cancel: 'button.cancel'
    },

    regions: {
      list: '.projectList',
      detail: '.projectDetail'
    },

    initialize: function(options){
      this.markers = {};

      this.collection.fetch({
        user: options.user,
        data: {
          index_name: 'AlignedProjects'
        },
        success: _.bind(function(collection){
          var model = collection.get(options.current);

          if (model) { this.showDetail(model); }
        }, this)
      });

      this.geosearch = new Project.views.AdminGeosearch();

      this.listenTo(this.geosearch, 'found', function(loc){
        this.triggerMethod('new:location', {
          address: _.compact([
            loc.address.house_number,
            loc.address.road
          ]).join(' '),
          city: loc.address.city,
          state: loc.address.state,
          zipcode: loc.address.postcode,
          latitude: parseFloat(loc.lat),
          longitude: parseFloat(loc.lon)
        });
      });

      this.listView = new Project.views.AdminList({
        collection: this.collection
      });

      this.listenTo(this.listView, 'itemview:show:detail', function(view, args){
        this.showDetail(args.model);
      });

      // Update breadcrumbs
      Backbone.trigger('reset:breadcrumbs', {
        state:'admin',
        display_name: 'Admin'
      });

      Backbone.trigger('set:breadcrumbs', {state:'projects', display_name:'Projects'});

      // Update history
      Backbone.history.navigate('/admin/projects');
    },

    triggers: {
      'click .refresh-icon': 'refresh',
      'click button.create': 'create',
      'click button.save': 'save',
      'click button.cancel': 'cancel'
    },

    collectionEvents: {
      'add': 'setMarker',
      'remove': 'removeMarker',
      'reset': 'resetMarkers'
    },

    onShow: function(){
      this.map = L.map(this.ui.map[0]).setView([35, 0], 3);

      // add an OpenStreetMap tile layer
      L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
      }).addTo(this.map).setOpacity(0.99);

      this.ui.map.append( this.geosearch.render().el );
      this.resetMarkers();

      this.list.show(this.listView);
    },

    onRefresh: function(){
      this.ui.refresh.addClass('active');
      this.collection.fetch({
        data: {
          index_name: 'AlignedProjects'
        },
        success: _.bind(function(){
          this.ui.refresh.removeClass('active');
        }, this)
      });
    },

    onCreate: function(){
      this.showDetail();
    },

    onSave: function(){
      var existing = this.collection.get(this.model),
        detailView = this.detail.currentView,
        values;

      if (detailView && detailView.isValid()) {
        this.ui.save.addClass('loading-left');

        values = _.clone(detailView.changed);

        if (!existing) {
          values.notes = this.model.formatNote('created project');
        }

        this.model.save(values, {
          success: _.bind(function(){
            if (!existing) {
              this.collection.add(this.model);
            }
            this.ui.save.removeClass('loading-left');
          }, this)
        });
      }
    },

    onCancel: function(){
      this.hideDetail();
      Backbone.history.navigate('/admin/projects');
    },

    onClose: function(){
      this.map.remove();
    },

    onNewLocation: function(attr){
      if (!this.model) {
        this.showDetail(attr);

      } else if (this.model && this.model.isNew()) {
        this.model.set(attr);

      } else {
        this.focusMap([attr.latitude, attr.longitude]);
      }
    },

    showDetail: function(model){
      var view;

      if (!(model instanceof Backbone.Model)) {
        model = new Project.Model(model, {
          collection: this.collection,
          user: this.options.user,
          silent: false
        });

        this.listenTo(model, 'change:latitude change:longitude', this.setMarker);
        this.setMarker(model);
      }

      view = new Project.views.AdminDetail({
        collection: this.collection,
        model: model
      });

      this.listenToOnce(view, 'close', function(){
        if (!this.collection.contains(model)) {
          this.stopListening(model);
          this.removeMarker(model);
        }

        this.model = null;
      });

      this.detail.show(view);

      this.focusMap(model);
      this.listView.setActive(model);
      this.ui.save.toggle(model.isEditable() || !model.isLocked());
      this.ui.cancel.show();

      if (model.id) {
        Backbone.history.navigate('/admin/projects/' + model.id);
      }

      this.model = model;
    },

    hideDetail: function(){
      this.detail.close();

      this.listView.setActive();
      this.ui.save.hide();
      this.ui.cancel.hide();
    },

    focusMap: function(loc){
      if (loc instanceof Backbone.Model) {
        loc = this.getLocation(loc);
      }

      if (loc) {
        this.map.setView(loc, 18);
      }
    },

    setMarker: function(model){
      var marker = this.markers[model.cid],
        loc = this.getLocation(model);

      if (!loc || !this.map) { return; }

      if (marker) {
        marker.setLatLng(loc);

      } else {
        marker = this.markers[model.cid] = L.marker(loc, {
          title: model.get('display_name'),
          draggable: model.isNew(),
          icon: L.divIcon({
            className: 'ok',
            iconSize: [15,32]
          })
        });

        marker.on('click', function(){
          if (model !== this.model) {
            this.showDetail(model);
          }
        }, this);

        marker.on('dragend', function(){
          if (model === this.model && model.isNew()) {
            this.setLocation(model, marker.getLatLng());
          }
        }, this);

        marker.addTo(this.map);
      }

      if (model === this.model) {
        this.focusMap(loc);
      }
    },

    removeMarker: function(model){
      var marker = this.markers[model.cid];

      if (marker) {
        this.map.removeLayer(marker);
        delete this.markers[model.cid];
      }
    },

    resetMarkers: function(){
      _.each(this.markers, function(marker, cid){
        // Don't remove markers for projects still in the collection.
        if (this.collection.get(cid)) { return; }

        // Don't remove the marker for the current project.
        if (this.model && this.model.cid === cid) { return; }

        this.removeMarker({cid: cid});
      }, this);

      this.collection.each(function(model){
        this.setMarker(model);
      }, this);
    },

    getLocation: function(model){
      if (model.has('latitude') && model.has('longitude')) {
        return [model.get('latitude'), model.get('longitude')];
      }
    },

    setLocation: function(model, loc){
      model.set({
        latitude: loc.lat,
        longitude: loc.lng
      });
    }
  });
});
