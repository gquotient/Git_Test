define(
  [
    'jquery',
    'underscore',
    'backbone',
    'backbone.marionette',
    'backbone.marionette.handlebars',

    'hbs!app/modules/project/templates/dataList',
    'hbs!app/modules/project/templates/dataListItem'
  ],
  function($, _, Backbone, Marionette, MarionetteHandlebars, DataListTemplate, DataListItemTemplate){

    var Project = { models: {}, views: {}, layouts: {}, collections: {} };

    Project.models.Project = Backbone.Model.extend({});

    Project.collections.DataList = Backbone.Collection.extend({
      model: Project.models.Project,
      url: '/api/projects'
    });

    Project.collections.Markers = Backbone.Collection.extend({
      model: Project.models.Project
    });

    Project.views.DataListItem = Marionette.ItemView.extend({
      template: {
        type: 'handlebars',
        template: DataListItemTemplate
      },
      initialize: function(options){
        Handlebars.registerHelper('projectId', function() {
          return this.name.replace(' ', '_');
        });
      },
      render: function(){
        this.setElement(this.template.template(this.model.attributes));
      }
    });

    Project.views.DataList = Marionette.CompositeView.extend({
      template: {
        type: 'handlebars',
        template: DataListTemplate
      },
      itemViewContainer: 'tbody',
      itemView: Project.views.DataListItem,
      initialize: function(options){
        var that = this;

        this.controller = options.controller;

        // This shouldn't really live here?
        this.listenTo(this.controller, 'select:portfolio', function(options){
          // Reset collection.
          that.collection.reset(options.model.get('projects').models);
        });
      }
    });

    Project.views.map = Backbone.Marionette.ItemView.extend({
      initialize: function(options){
        this.controller = options.controller;
        var that = this;

        this.listenTo(this.collection, 'reset', this.updateMarkers);
      },
      markerStyles: {
        OK: L.icon({
          iconUrl: '/public/img/icon_marker_ok.png',
          // They claim L.icon inherits from icon.Default buuuuut it lost some properties...
          shadowUrl: '/public/img/icon_marker_shadow.png'
        }),
        Warning: L.icon({
          iconUrl: '/public/img/icon_marker_warn.png',
          shadowUrl: '/public/img/icon_marker_shadow.png'
        }),
        Alert: L.icon({
          iconUrl: '/public/img/icon_marker_alert.png',
          shadowUrl: '/public/img/icon_marker_shadow.png'
        })
      },
      render: function(){
        // Create a container for the leaflet map
        this.setElement($('<div id="leafletContainer" />'));
      },
      updateMarkers: function(){
        var that = this;

        // Clear Old Markers;
        this.markers.clearLayers();

        // Build marker objects and markers
        this.collection.each( function(project){

          var latLong = project.get('latLong');

          if (latLong && latLong.length) {
            L.marker(
              [latLong[0], latLong[1]],
              {
                icon: that.markerStyles[project.get('status')],
                project: project
              }
            ).addTo(that.markers);
          }
        });

        return this;
      },

      fitToBounds: function(bounds){
        var
          south,
          west,
          north,
          east
        ;

        if (bounds) {
          south = bounds.south;
          west = bounds.west;
          north = bounds.north;
          west = bounds.west;
        } else {
          this.markers.eachLayer( function(marker){
            var lat = marker._latlng.lat,
                lng = marker._latlng.lng;

            // This stuff is ugly but I couldn't think of a better way since it's 2 dimensional
            if (south === undefined) {
              south = lng;
            } else {
              if (lng < south) {
                south = lng;
              }
            }

            if (west === undefined) {
              west = lat;
            } else {
              if (lat < west) {
                west = lat;
              }
            }

            if (north === undefined) {
              north = lng;
            } else {
              if (lng > north) {
                north = lng;
              }
            }

            if (east === undefined) {
              east = lat;
            } else {
              if (lat > east) {
                east = lat;
              }
            }
          });
        }

        // Leaflet method to snap to bounds
        this.map.fitBounds([
          [west, south], // southwest
          [east, north]  // northeast
        ]);
      },

      build: function(){
        var that = this,
            projects = this.collection.models,
            map = this.map = L.map('leafletContainer').setView([30.2, -97.7], 1);

        // add an OpenStreetMap tile layer
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Create array to store markers
        this.markers = L.layerGroup([]);
        this.markers.addTo(map);

        // Build marker objects and markers
        this.updateMarkers();

        // Pan and center on outtermost markers
        this.fitToBounds();
        return this;
      }
    });

    return Project;
});
