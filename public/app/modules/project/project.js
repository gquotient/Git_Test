define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'leaflet',
  'css!components/leaflet/dist/leaflet.css',

  'device',
  './editor',

  'hbs!project/templates/dataList',
  'hbs!project/templates/dataListItem',
  'hbs!project/templates/dashboardItem',
  'hbs!project/templates/create'
], function(
  $,
  _,
  Backbone,
  Marionette,

  L,
  leafletCSS,

  Device,
  Editor,

  dataListTemplate,
  dataListItemTemplate,
  dashboardItemTemplate,
  createTemplate
){
  var Project = { views: {} };

  Project.Model = Backbone.Model.extend({
    idAttribute: 'label',
    url: '/api/projects',
    defaults: {
      type: 'project'
    },

    initialize: function(){
      this.devices = new Device.Collection();
    },

    validate: function(attrs){
      if (
        attrs.name === '' ||
        attrs.site_label === '' ||
        isNaN(attrs.latitude) ||
        isNaN(attrs.longitude) ||
        isNaN(attrs.elevation)
      ) { return 'error'; }
    }
  });

  Project.Collection = Backbone.Collection.extend({
    model: Project.Model,

    findByProjectLabel: function(label){
      return this.findWhere({project_label: label});
    },

    findBySiteLabel: function(label){
      var projects = this.where({site_label: label});
      return projects.length === 1 ? projects[0] : null;
    }
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
      var that = this,
        icon = this.markerStyles[this.model.get('status')];

      this.marker = L.marker(
        [
          this.model.get('latitude'),
          this.model.get('longitude')
        ],
        {
          id: this.model.id,
          icon: icon || this.markerStyles.OK,
          opacity: 0
        }
      );

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

    highlight: function(model){
      clearTimeout(this.highlightTimeout);

      if (!model) {
        this.unmask();
      } else if (model === this.model) {
        this.unmask();
      } else if (model.projects && model.projects.contains(this.model)) {
        this.unmask();
      } else {
        this.mask();
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
      if (!bounds && this.collection.length === 0) { return; }

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
      var lats = this.collection.pluck('latitude'),
        lngs = this.collection.pluck('longitude');

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

  Project.views.Create = Marionette.ItemView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: createTemplate
    },

    ui: {
      'name': '#name',
      'label': '#site_label',
      'latitude': '#latitude',
      'longitude': '#longitude',
      'elevation': '#elevation'
    },

    triggers: {
      'submit': 'submit',
      'reset': 'reset'
    },

    onSubmit: function(){
      this.model.save({
        name: this.ui.name.val().trim(),
        site_label: this.ui.label.val().replace(/\W|_/g, ''),
        latitude: parseFloat(this.ui.latitude.val()),
        longitude: parseFloat(this.ui.longitude.val()),
        elevation: parseFloat(this.ui.elevation.val()) || 0
      }, {
        success: function(model){
          Backbone.trigger('create:project', model);
        }
      });
    },

    onReset: function(){
      this.render();
    }
  });

  Project.views.Editor = Editor;

  return Project;
});
