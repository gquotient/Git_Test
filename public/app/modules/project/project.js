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

    Project.views.DataListItem = Marionette.ItemView.extend({
      template: {
        type: 'handlebars',
        template: DataListItemTemplate
      },
      initialize: function(){
        // Template helper to make useable ids for elements
        Handlebars.registerHelper('projectId', function() {
          return this.name.replace(' ', '_');
        });
      },
      render: function(){
        this.setElement(this.template.template(this.model.attributes));
      },
      events: {
        'mouseover': function(){
          Backbone.trigger('mouseover:project', this);
        },
        'mouseout': function(){
          Backbone.trigger('mouseout:project', this);
        }
      }
    });

    Project.views.DataList = Marionette.CompositeView.extend({
      template: {
        type: 'handlebars',
        template: DataListTemplate
      },
      itemViewContainer: 'tbody',
      itemView: Project.views.DataListItem
    });

    Project.views.map = Backbone.Marionette.ItemView.extend({
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
      selectMarkers: function(projects){
        // projects should be an array of project models
        var
          ids = []
        ;

        _.each(projects, function(project){
          ids.push(project.id);
        });

        return ids;
      },
      hideMarkers: function(projects){
        // projects should be an array of project models
        var ids = this.selectMarkers(projects);

        _.each(this.markers, function(marker){
          var myMarker = $([marker.marker._icon, marker.marker._shadow]);

          if (ids.indexOf(marker.id) >= 0) {
            // show marker
            // This is a little hackey but there doesn't seem to be a hide/show method in leaflet
            myMarker.fadeIn();
          } else {
            // hide marker
            myMarker.fadeOut();
          }
        });

        return this;
      },
      hilightMarkers: function(projects){
        var ids = this.selectMarkers(projects);

        _.each(this.markers, function(marker){
          var myMarker = $([marker.marker._icon, marker.marker._shadow]);

          if (ids.length) {
            if (ids.indexOf(marker.id) >= 0) {
              myMarker.css({opacity: 1});
              marker.marker.setZIndexOffset(1000);
            } else {
              myMarker.css({opacity: 0.25});
              marker.marker.setZIndexOffset(0);
            }
          } else {
            myMarker.css({opacity: 1});
            marker.marker.setZIndexOffset(0);
          }
        });
      },
      fitToBounds: function(bounds){
        var
          south,
          west,
          north,
          east,
          myBounds
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

        myBounds = new L.LatLngBounds(
          [west, south], // southwest
          [east, north]  // northeast
        );

        // Leaflet method to snap to bounds
        // NOTE: I've come to believe this pad method doesn't work properly. It seems to only have 3 settings. Off, on, and holy crap
        this.map.fitBounds(myBounds.pad(0));
      },
      build: function(){
        var that = this,
            projects = this.collection.models,
            map = this.map = L.map('leafletContainer').setView([0, 0], 1);

        // add an OpenStreetMap tile layer
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Create array to store markers
        this.markers = [];

        // Build marker objects and markers
        _.each(projects, function(project){
          var latLng = project.attributes.latLng;

          if (latLng && latLng.length) {
            var newMarker = {
              marker: L.marker(
                [latLng[0], latLng[1]],
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
      },
      initialize: function(){
        var that = this;

        this.listenTo(Backbone, 'select:portfolio', function(portfolio){
          that.hideMarkers(portfolio.model.attributes.projects);
        });

        this.listenTo(Backbone, 'mouseover:project', function(project){
          that.hilightMarkers(project);
        });

        this.listenTo(Backbone, 'mouseout:project', function(project){
          that.hilightMarkers();
        });

        this.listenTo(Backbone, 'mouseover:portfolio', function(portfolio){
          that.hilightMarkers(portfolio.model.attributes.projects);
        });

        this.listenTo(Backbone, 'mouseout:portfolio', function(portfolio){
          that.hilightMarkers();
        });
      }
    });

    return Project;
});
