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
      map: '#map'
    },

    regions: {
      list: '#projectList',
      detail: '#projectDetail'
    },

    initialize: function(options){
      this.markers = {};

      this.collection.fetch({
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

      // Update history
      Backbone.history.navigate('/admin/projects');
    },

    triggers: {
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

    onCreate: function(){
      this.showDetail();
    },

    onSave: function(){
      var that = this;

      // Don't save if there isn't currently a detail view.
      if (!this.detail.currentView) { return; }

      this.detail.$el.find('input').blur();

      // Don't save if any data is invalid.
      if (this.detail.$el.find('.invalid').length > 0) { return; }

      // Don't save if the model already exists.
      if (this.collection.contains(this.model)) { return; }

      this.collection.create(this.model, {
        wait: true,
        success: function(){
          that.model.addNote('created project', that.options.user);
        }
      });
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
        model = new Project.Model(model, {silent: false});
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

      this.model = model;
      this.focusMap(model);

      this.detail.show(view);
      this.$('.save, .cancel').show();

      if (model.id) {
        Backbone.history.navigate('/admin/projects/' + model.id);
      }
    },

    hideDetail: function(){
      this.detail.close();
      this.$('.save, .cancel').hide();
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
