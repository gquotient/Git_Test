define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'leaflet',
  'css!components/leaflet/dist/leaflet.css',

  'hbs!project/templates/dataList',
  'hbs!project/templates/dataListItem',
  'hbs!project/templates/dashboardItem'
], function(
  $,
  _,
  Backbone,
  Marionette,

  L,
  leafletCSS,

  dataListTemplate,
  dataListItemTemplate,
  dashboardItemTemplate
){
  var Project = { models: {}, views: {}, layouts: {}, collections: {} };

  Project.models.Project = Backbone.Model.extend({
    defaults: {
      type: 'project'
    }
  });

  Project.collections.Projects = Backbone.Collection.extend({
    model: Project.models.Project,
    url: '/api/projects'
  });

  Project.views.DataListItem = Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: dataListItemTemplate
    },
    render: function(){
      this.setElement(this.template.template(this.model.attributes));
    },
    events: {
      mouseover: function(){
        Backbone.trigger('mouseover:project', this.model);
      },
      mouseout: function(){
        Backbone.trigger('mouseout:project', this.model);
      },
      click: function(){
        Backbone.trigger('select:project', this.model);
      }
    }
  });

  Project.views.DataListView = Marionette.CompositeView.extend({
    template: {
      type: 'handlebars',
      template: dataListTemplate
    },
    itemViewContainer: 'tbody',
    itemView: Project.views.DataListItem,

    onClose: function(){
      this.collection = null;
    }
  });


  Project.views.DashboardItemView = Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: dashboardItemTemplate
    }
  });

  Project.views.Dashboard = Marionette.CollectionView.extend({
    itemView: Project.views.DashboardItemView
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
            id: that.model.id,
            opacity: 0
          }
        );
      }

      var highlight = function() {
        that.unmask();
      };

      var highlightTimeout = function() {
        that.highlightTimeout = setTimeout(highlight, 200);
      };

      this.listenTo(Backbone, 'mouseover:project', this.highlight);
      this.listenTo(Backbone, 'mouseout:project', highlightTimeout);
      this.listenTo(Backbone, 'mouseover:portfolio', this.highlight);
      this.listenTo(Backbone, 'mouseout:portfolio', highlightTimeout);
    },

    markerStyles: {
      OK: L.divIcon({
        className: 'ok',
        iconSize: [15,32] // Leaflet is overriding the CSS width and heigh with element styles, so I added these iconSizes.
      }),
      Warning: L.divIcon({
        className: 'warning',
        iconSize: [15,32]
      }),
      Alert: L.divIcon({
        className: 'alert',
        iconSize: [15,32]
      })
    },

    highlight: function(projectOrPortfolio){
      clearTimeout(this.highlightTimeout);
      // This is a little hacky right now.
      if (!projectOrPortfolio) {
        this.unmask();
      } else if (projectOrPortfolio.get('projects') === undefined) {
        if (this.model !== projectOrPortfolio) {
          this.mask();
        } else {
          this.unmask();
        }
      } else {
        if (!projectOrPortfolio.get('projects').contains(this.model)){
          this.mask();
        } else {
          this.unmask();
        }
      }
    },

    fadeTo: function(duration, opacity, callback){
      $(this.marker._icon).stop().fadeTo(duration, opacity, callback);
    },

    mask: function(){
      this.marker.setOpacity(0.33);
      this.marker.setZIndexOffset(0);
    },

    unmask: function(){
      this.marker.setOpacity(1.0);
      this.marker.setZIndexOffset(1000);
    },

    render: function(){

      var that = this;

      //append marker to the map
      this.marker.addTo(this.options.markers);

      this.fadeTo(300, 1);

      //can't use events hash, because the events are bound
      //to the marker, not the element. It would be possible
      //to set the view's element to this.marker._icon after
      //adding it to the map, but it's a bit hacky.
      this.marker.on('mouseover', function(){
        Backbone.trigger('mouseover:project', that.model);
      });

      this.marker.on('mouseout', function(){
        Backbone.trigger('mouseout:project', that.model);
      });

      this.marker.on('click', function(){
        Backbone.trigger('select:project', that.model);
      });
    },

    remove: function(){
      var that = this;
      this.stopListening();
      this.fadeTo(250, 0, function(){ that.options.markers.removeLayer(that.marker); } );
    }
  });

  Project.views.Map = Marionette.CollectionView.extend({
    itemView: Project.views.MarkerView,

    itemViewOptions: function(){
      return { markers: this.markers };
    },

    attributes: {
      id: 'leafletContainer'
    },

    fitToBounds: function(bounds){
      bounds = bounds || this.findBounds();

      bounds = new L.LatLngBounds(
        [bounds.south, bounds.west], // southwest
        [bounds.north, bounds.east]  // northeast
      );

      // Leaflet method to snap to bounds
      // NOTE: I've come to believe this pad method doesn't work properly. It seems to only have 3 settings. Off, on, and holy crap
      this.map.fitBounds(bounds.pad(0));
    },

    findBounds: function(){
      var lats = [], lngs = [];

      this.collection.each(function(model){
        var latLng = model.get('latLng');
        lats.push(latLng[0]);
        lngs.push(latLng[1]);
      });

      return {
        south: _.min(lats),
        west: _.min(lngs),
        north: _.max(lats),
        east: _.max(lngs)
      };
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

      this.fitToBounds();

      this.listenTo(Backbone, 'window:resize', this.map.viewreset);
    }
  });

  return Project;
});
