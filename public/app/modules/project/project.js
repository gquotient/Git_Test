define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'leaflet',
  'css!leaflet.css', //This seems silly but also seems to work, sooooo...

  'navigation',
  'device',
  'equipment',
  'issue',

  './admin',
  './editor',

  'hbs!project/templates/dataList',
  'hbs!project/templates/dataListItem',
  'hbs!project/templates/dashboard',
  'hbs!project/templates/markerPopUp',
  'hbs!project/templates/markerPopUpDetail',
  'hbs!project/templates/navigationList',
  'hbs!project/templates/navigationListItem',
  'hbs!project/templates/kpis',
  'hbs!project/templates/item'
], function(
  $,
  _,
  Backbone,
  Marionette,

  L,
  leafletCSS,

  Navigation,
  Device,
  Equipment,
  Issue,

  adminViews,
  editorViews,

  dataListTemplate,
  dataListItemTemplate,
  dashboardTemplate,
  markerPopUpTemplate,
  markerPopUpDetailTemplate,
  navigationListTemplate,
  navigationListItemTemplate,
  kpisTemplate,
  itemTemplate
){
  var Project = { views: {} };

  Project.Model = Backbone.Model.extend({
    idAttribute: 'project_label',

    defaults: {
      type: 'project',
      kpis: {
        irradiance: 0,
        power: 0,
        pr: 0,
        energyProduction: {
          generated: 0,
          forecast: 0,
          modeled: 0,
          year: 0,
          month: 0,
          week: 0
        }
      },
      dataSources: {
        energy: '',
        inverter: ''
      },
      notes: '',
      status: 'OK'
    },

    initialize: function(){
      console.log(this);
      this.devices = new Device.Collection();
      this.outgoing = new Device.Collection();
      this.issues = new Issue.Collection([], {projectId: this.id});

      this.lazySave = _.debounce(Backbone.Model.prototype.save, 1000);

      this.listenTo(this.issues, 'reset', this.setStatus);
    },

    setStatus: function(issues){
      var statusLevels = ['OK', 'Warning', 'Alert'],
          status = 'OK';

      issues.each(function(issue){
        var priority = issue.get('active_conditions')[0].priority;

        if (_.indexOf(statusLevels, priority) > _.indexOf(statusLevels, status)) {
          status = priority;
        }
      });

      this.set('status', status);
    },

    setLock: function(lock){
      var that = this;

      return $.ajax(_.result(this, 'url') + '/edit', {
        type: 'PUT',
        data: {
          project_label: this.id,
          lock: arguments.length > 0 ? lock : true
        },
        dataType: 'json'
      }).always(function(data){
        that.set({locked: _.isBoolean(data.locked) ? data.locked : true});
      });
    },

    makeEditable: function(){
      return $.ajax(_.result(this.collection, 'url') + '/edit', {
        type: 'POST',
        data: {
          project_label: this.id
        }
      });
    },

    fetchKpis: function(){
      var that = this;

      return $.ajax({
        url: '/api/kpis',
        cache: false,
        type: 'POST',
        dataType: 'json',
        data: {
          traces: [
            {
              project_label: this.id,
              project_timezone: this.get('timezone')
            }
          ]
        }
      })
      .done(function(data){
        console.log(data);
        that.trigger('data:done', data);
        that.parseKpis(data.response[0]);
      });
    },

    parseKpis: function(data){
      var kpis = {
        irradiance: data.performance_snapshot.irradiance || 0,
        power: data.performance_snapshot.ac_power || 0,
        pr: (data.performance_snapshot.perf_ratio * 100) || 0,
        energyProduction: {
          generated: 0,
          forecast: 0,
          modeled: 0,
          year: data.energy_production.ac_year_to_date || 0,
          month: data.energy_production.ac_month_to_date || 0,
          week: data.energy_production.ac_week_to_date || 0
        }
      };

      this.set('kpis', kpis);
    },

    fetchDDLs: function(){
      var that = this;

      return $.ajax({
        url: '/api/discovery/' + this.id + '/ddls',
        cache: false,
        type: 'GET',
        dataType: 'json'
      })
      .done(function(data){
        that.trigger('data:done', data);
        that.set('ddls', data.ddls);
      });
    },

    // Method for finding which power type is available
    findDataSources: function(){
      var
        that = this,
        defer = $.Deferred(),
        ddls = this.get('ddls'),
        selectDataSources = function(){
          var
            energySources = [
              'pgen-acm',
              'pgen-rm',
              'pgen-util'
            ],
            dataSources = {
              energy: '',
              inverter: {
                ac_power: false,
                dc_power: false,
                bus: false // bus-str-calc loop through child busses and build traces
              }
            }
          ;

          for(var source=0, sourcesLength=energySources.length; source<=sourcesLength; source++){
            // Add '_300' to the string for now since that's how it is in the ddls
            if (_.indexOf(ddls, energySources[source]) >= 0) {
              dataSources.energy = energySources[source];
              break;
            }
          }

          if (_.indexOf(ddls, 'inv') >= 0) {
            dataSources.inverter.ac_power = true;
            dataSources.inverter.dc_power = true;
          }

          if (_.indexOf(ddls, 'bus-str-calc') >= 0) {
            dataSources.inverter.bus = true;
          }

          return dataSources;
        }
      ;

      if (ddls) {
        // Model already has DDLs, resolve the defer with the correct energy
        defer.resolve(selectDataSources());
      } else {
        // Else, fetch the DDLs and resolve the chain
        this.fetchDDLs().done(function(data){
          ddls = data.ddls;

          if (ddls) {
            defer.resolve(selectDataSources());
          } else {
            console.warn('No DDLs found. Call Thadeus');
            defer.reject();
          }
        });
      }

      return defer;
    },

    parse: function(resp, options){
      if (resp.devices) {
        this.devices.reset(resp.devices, {
          equipment: options.equipment
        });

        if (resp.rels) {
          _.each(resp.rels, function(rel) {
            var source = this.devices.get(rel[2]),
              target = this.devices.get(rel[0]),
              relationship = rel[1];

            if (!target && rel[0] === resp.id) {
              target = this;
            }

            if (source && target) {
              source.connectTo(target, relationship);
            }
          }, this);
        }

        _.each(_.keys(Equipment.renderings), function(label){
          this.checkOutgoing(this, label);
        }, this);
      }

      return _.omit(resp, 'devices', 'rels');
    },

    checkOutgoing: function(target, label){
      if (!target.outgoing) { return; }

      target.outgoing.each(function(device){
        if (!device.equipment) { return; }

        // For now ignore strings and panels.
        if (_.contains(['S', 'P'], device.equipment.get('label'))) { return; }

        // Add position to device for this rendering.
        device.equipment.addRendering(device, this, label, target);

        // Recursively check all outgoing devices for this rendering.
        this.checkOutgoing(device, label);
      }, this);
    },

    addNote: function(note, user){
      this.set({notes: this.formatNote(note, user) + this.get('notes')});
      this.lazySave();
    },

    formatNote: function(msg, user){
      var now = new Date(),
        when = now.toISOString().replace('T', ' at ').replace(/\.\d+Z$/, '') + ' ',
        who = user ? user.get('name') + ' ' : '';

      return when + who + msg + '\n';
    }
  });

  Project.Collection = Backbone.Collection.extend({
    model: Project.Model,
    url: '/api/projects',

    getOrCreate: function(label){
      return this.get(label) || this.push({project_label: label});
    }
  });

  Project.views.Item = Backbone.Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: itemTemplate
    },
    triggers: {
      'click': 'select:project'
    },
    tagName: 'li'
  });

  Project.views.List = Backbone.Marionette.CollectionView.extend({
    itemView: Project.views.Item,
    tagName: 'ul'
  });

  Project.views.DataListItem = Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: dataListItemTemplate
    },
    tagName: 'tr',
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
    },
    initialize: function(options){
      this.listenTo(this.model, 'change:status', this.render);
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
      template: dashboardTemplate
    },
    events: {
      'click': function(){
        Backbone.history.navigate('/project/'+this.model.id, true);
      }
    },
    onShow: function(){
      this.model.fetchKpis().done(this.render);
    }
  });

  Project.views.Dashboard = Marionette.CollectionView.extend({
    itemView: Project.views.DashboardItemView
  });

  Project.views.MarkerPopUp = Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: markerPopUpTemplate
    },
    events: {
      'click a.viewProject': function(event){
        event.preventDefault();
        Backbone.trigger('select:project', this.model);
      },
      'click a.viewDevices': function(event){
        event.preventDefault();
        Backbone.history.navigate('/project/' + this.model.id + '/devices', true);
      }
    },
    initialize: function(options){
      this.render();
    }
  });

  Project.views.MarkerPopUpDetail = Project.views.MarkerPopUp.extend({
    template: {
      type: 'handlebars',
      template: markerPopUpDetailTemplate
    }
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

      this.listenTo(this.model, 'change:status', function(model){
        this.marker.setIcon(this.markerStyles[model.get('status')]);
      });

      this.listenTo(Backbone, 'mouseover:project', this.highlight);
      this.listenTo(Backbone, 'mouseout:project', highlightTimeout);
      this.listenTo(Backbone, 'mouseover:portfolio', this.highlight);
      this.listenTo(Backbone, 'mouseout:portfolio', highlightTimeout);
    },

    popUp: Project.views.MarkerPopUp,

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

      // Instantiate pop up content
      this.popUp = new this.popUp({model: this.model});
      this.marker.bindPopup(this.popUp.el);

      // Fade in marker
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
    },
    onClose: function(){
      this.popUp.close();
    },
    remove: function(){
      var that = this;
      this.stopListening();
      this.fadeTo(250, 0, function(){ that.options.markers.removeLayer(that.marker); } );
      this.popUp.close();
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

    fullscreen: {
      active: false,
      activate: false,
      close: false
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

    initFullscreen: function(){
      // Save fullscreen method
      if (this.el.webkitRequestFullscreen) { this.fullscreen.activate = this.el.webkitRequestFullscreen; }
      else if (this.el.mozRequestFullScreen) { this.fullscreen.activate = this.el.mozRequestFullScreen; }
      else if (this.el.requestFullscreen) { this.fullscreen.activate = this.el.requestFullscreen; }// Opera

      // Save exit fullscreen method
      if (document.webkitExitFullscreen) { this.fullscreen.close = document.webkitExitFullscreen; }
      else if (document.mozCancelFullscreen) { this.fullscreen.close = document.mozCancelFullscreen; }
      else if (document.exitFullscreen) { this.fullscreen.close = document.exitFullscreen; }

      // Add button only if fullscreen API is available
      if (this.fullscreen.activate) {
        this.$el.append('<button class="fullscreen button sml">Fullscreen</button>');
      }
    },

    toggleFullscreen: function(){
      if (!this.fullscreen.active) {
        this.fullscreen.active = true;
        this.fullscreen.activate.call(this.el);
      } else {
        this.fullscreen.active = false;
        this.fullscreen.close.call(document);
      }
    },

    layerControls: function(){
      var $controls = $('<div class="layerControls leaflet-control"><ul></ul></div>');

      _.each(this.layers, function(layer, index){
        if (layer.layer) {
          var
            checked = (layer.active)? 'checked' : '',
            layerControl = [
              '<li>' +
                '<label for="layer_' + layer.type + '"">' +
                  '<input id="layer_' + layer.type + '" class="layerControl" type="checkbox" ' +
                  checked +
                  '> ' +
                  layer.displayName +
                '</label>' +
              '</li>'
            ].join('')
          ;

          $controls.find('ul').append(layerControl);
        }
      });

      this.$el.append($controls);
    },

    toggleLayer: function(layer){
      var myLayer = _.findWhere(this.layers, {type: layer});

      if (myLayer.active) {
        myLayer.active = false;
        myLayer.layer.setOpacity(0);
      } else {
        myLayer.active = true;
        myLayer.layer.redraw();
        myLayer.layer.setOpacity(0.5);
      }
    },

    addLayers: function(){
      var that = this;

      this.layers = [];

      // Create cloud object NOTE: May want to Backboneify this
      var cloudLayer = {
        type: 'clouds',
        displayName: 'Clouds',
        active: true
      };

      // Create tiles layer and add to our map
      cloudLayer.layer = L.tileLayer('http://{s}.tile.openweathermap.org/map/clouds/{z}/{x}/{y}.png', {
        attribution: 'OpenWeatherMap'
      }).addTo(this.map).setOpacity(0.5);

      var precipitationLayer = {
        type: 'precipitation',
        displayName: 'Precipitation',
        active: false
      };

      //* Precipitation layer
      precipitationLayer.layer = L.tileLayer('http://{s}.tile.openweathermap.org/map/precipitation/{z}/{x}/{y}.png', {
        //attribution: 'OpenWeatherMap'
      }).addTo(this.map).setOpacity(0);
      //*/

      // Push cloud layer to layers
      this.layers.push(cloudLayer, precipitationLayer);

      // Build layer toggle controls
      this.layerControls();

      // Update layers
      var fetchLayerTiles = function(){
        _.each(that.layers, function(layer){
          // Only bother refetching if it's currently visible
          if (layer.active) {
            layer.layer.redraw();
          }
        });
      };

      this.fetchLayerTilesInterval = setInterval(fetchLayerTiles, 900000);
    },

    onShow: function(){
      var map = this.map = L.map(this.el).setView([0, 0], 1);

      // add an OpenStreetMap tile layer
      L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
      }).addTo(map).setOpacity(0.99);

      this.markers = new L.layerGroup([]);

      this.markers.addTo(this.map);

      this.addLayers();

      this._renderChildren();

      this.fitToBounds();

      this.initFullscreen();

      this.listenTo(Backbone, 'window:resize', this.map.viewreset);
    },

    events: {
      'click .layerControl': function(event){
        this.toggleLayer(event.target.id.split('_')[1]);
      },
      'click .fullscreen': 'toggleFullscreen'
    }
  });

  Project.views.NavigationListItemView = Navigation.views.ListItem.extend({
    template: {
      type: 'handlebars',
      template: navigationListItemTemplate
    },
    events: {
      'click': function(){
        Backbone.trigger('click:project', this.model);
      }
    }
  });

  /* This composite view is the wrapper view for the list of portfolios.
     It handles nesting the list while allowing for the navigation header. */
  Project.views.NavigationListView = Navigation.views.List.extend({
    template: {
      type: 'handlebars',
      template: navigationListTemplate
    },
    itemView: Project.views.NavigationListItemView,
    events: {
      'change #project-sort': function(event){
        this.sort(event.currentTarget.value);
      }
    }
  });

  Project.views.Kpis = Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: kpisTemplate
    },
    initialize: function(){
      this.model.fetchKpis();
      this.listenTo(this.model, 'change:kpis', this.render);
    }
  });

  _.extend(Project.views, adminViews, editorViews);

  return Project;
});
