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

    Project.collections.Projects = Backbone.Collection.extend({
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
          Backbone.trigger('mouseover:project', this.model);
        },
        'mouseout': function(){
          Backbone.trigger('mouseout:project', this.model);
        }
      }
    });





    Project.views.DataListView = Marionette.CompositeView.extend({
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
        this.listenTo(Backbone, 'select:portfolio', function(options){
          // Reset collection.
          that.collection.reset(options.model.get('projects').models);
        });
      }
    });





    Project.views.MarkerView = Marionette.ItemView.extend({
      initialize: function(options){

        var that = this;

        var latLong = this.model.get('latLng');

        if (latLong && latLong.length) {
          this.marker = L.marker(
            [latLong[0], latLong[1]],
            {
              icon: that.markerStyles[that.model.get('status')],
              id: that.model.id
            }
          );
        }

        this.listenTo(Backbone, 'mouseover:project', this.highlight);
        this.listenTo(Backbone, 'mouseout:project', this.restore);
        this.listenTo(Backbone, 'mouseover:portfolio', this.highlight);
        this.listenTo(Backbone, 'mouseout:portfolio', this.restore);
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

      highlight: function(projectOrPortfolio){
        // This is a little hacky right now.
        if(projectOrPortfolio.get('projects') === undefined){
          if(this.model !== projectOrPortfolio){
            this.marker.setOpacity(0.5);
            this.marker.setZIndexOffset(0);
          }
        } else {
          if(!projectOrPortfolio.get('projects').contains(this.model)){
             this.marker.setOpacity(0.5);
             this.marker.setZIndexOffset(0);
          }
        }
      },

      restore: function(){
        this.marker.setOpacity(1.0);
        this.marker.setZIndexOffset(1000);
      },

      render: function(){

        var that = this;

        //append marker to the map
        this.marker.addTo(this.options.markers);

        //can't use events hash, because the events are bound
        //to the marker, not the element. It would be possible
        //to set the view's element to this.marker._icon after
        //adding it to the map, but it's a bit hacky.
        this.marker.on('mouseover', function(){
         Backbone.trigger('mouseover:project', that.model);
        } );

        this.marker.on('mouseout', function(){
          Backbone.trigger('mouseout:project', that.model);
        });
      },

      remove: function(){
        this.stopListening();
        this.options.markers.removeLayer(this.marker);
      }
    });








    Project.views.map = Marionette.CollectionView.extend({
      itemView: Project.views.MarkerView,

      itemViewOptions: function(){
          return { markers: this.markers };
      },

      attributes: {
        id: 'leafletContainer'
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

        myBounds = new L.LatLngBounds(
          [west, south], // southwest
          [east, north]  // northeast
        );

        // Leaflet method to snap to bounds
        // NOTE: I've come to believe this pad method doesn't work properly. It seems to only have 3 settings. Off, on, and holy crap
        this.map.fitBounds(myBounds.pad(0));
      },

      render: function(){
        this.isClosed = false;
        this.triggerBeforeRender();

        this.triggerRendered();
        return this;
      },

      onShow: function(){
        var map = this.map = L.map(this.el).setView([0, 0], 1);

        // add an OpenStreetMap tile layer
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        this.markers = new L.layerGroup([]);

        this.markers.addTo(this.map);

        this._renderChildren();
      },
      initialize: function(){
        var that = this;

        // Since we are overriding the 'render' method to get the map to work,
        // we need to explicitly call _renderChildren on reset.
        this.listenTo(this.collection, 'reset', this._renderChildren);

      }
    });

    return Project;
});
