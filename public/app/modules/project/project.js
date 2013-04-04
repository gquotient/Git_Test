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

        this.listenTo(this.controller, 'select:portfolio', function(options){
          // Reset collection and re render
          that.collection.reset(options.model.get('projects').models);
        });
      }
    });

    Project.views.map = Backbone.Marionette.ItemView.extend({
      initialize: function(options){
        this.controller = options.controller;
        var that = this;

        this.listenTo(this.controller, 'select:portfolio', function(arg){
          that.hideMarkers(arg.model.get('projects').models);
        });
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

        _.each(this.markers, function(marker){
          if (this.collection.pluck.indexOf(marker.id) >= 0) {
            // show marker
            // This is a little hackey but there doesn't seem to be a hide/show method in leaflet
            $(marker.marker._icon).fadeIn();
            $(marker.marker._shadow).fadeIn();
          } else {
            // hide marker
            $(marker.marker._icon).fadeOut();
            $(marker.marker._shadow).fadeOut();
          }
        });

      },
      hideMarkers: function(projects){
        // projects should be an array of project models
        var ids = [];

        _.each(projects, function(project){
          ids.push(project.id);
        });

        _.each(this.markers, function(marker){
          if (ids.indexOf(marker.id) >= 0) {
            // show marker
            // This is a little hackey but there doesn't seem to be a hide/show method in leaflet
            $(marker.marker._icon).fadeIn();
            $(marker.marker._shadow).fadeIn();
          } else {
            // hide marker
            $(marker.marker._icon).fadeOut();
            $(marker.marker._shadow).fadeOut();
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
          _.each(this.markers, function(marker){
            var lat = marker.marker._latlng.lat,
                lng = marker.marker._latlng.lng;

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
        this.markers = [];

        // Build marker objects and markers
        this.collection.each( function(project){
          var latLong = project.attributes.latLong;

          if (latLong && latLong.length) {
            var newMarker = {
              marker: L.marker(
                [latLong[0], latLong[1]],
                {
                  icon: that.markerStyles[project.attributes.status]
                }
              ).addTo(map),
              id: project.id
            };

            that.markers.push(newMarker);
          }
        });

        // Pan and center on outtermost markers
        this.fitToBounds();
        return this;
      }
    });

    return Project;
});
