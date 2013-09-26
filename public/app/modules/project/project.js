define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'backbone.virtualCollection',

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
  VirtualCollection,

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

      // Status as an array for sorting purposes
      status: 'Unknown',
      statusValue: -1,

      // Defaults for persisted model.
      rollup_intervals: '',
      ac_capacity: 0,
      dc_capacity: 0,
      capacity_units: 'watts',
      surface_area: 0,
      dm_push: false,
      elevation: 0,
      notes: ''
    },

    constructor: function(){
      // Need these initialized here for parsing.
      this.devices = new Device.Collection();
      this.outgoing = new Device.Collection();

      Backbone.Model.prototype.constructor.apply(this, arguments);
    },

    initialize: function(attrs, options){
      this.user = options.user;

      this.issues = new Issue.Collection([], {project: this});

      // This might be a bit convoluted and potentially fire too often but it works
      this.listenTo(this.issues, 'change reset add remove', function(){
        var status = this.issues.getSeverity();
        this.set(status);
      });

      this.on('change:editor', this.updateLockTimeout);
      this.updateLockTimeout();
    },

    isLocked: function(){
      return this.has('editor') && this.get('editor') !== 'unlocked';
    },

    isEditable: function(){
      return this.user && this.get('editor') === this.user.get('email');
    },

    setLock: function(lock){
      return $.ajax(_.result(this, 'url') + '/edit', {
        type: 'PUT',
        data: {
          project_label: this.id,
          lock: _.isBoolean(lock) ? lock : true
        },
        dataType: 'json'
      }).done(_.bind(function(data){
        var editor = data.editor;

        if (!editor) {
          editor = data.locked === true ? this.user.get('email') : 'unlocked';
        }

        this.set({editor: editor});
      }, this));
    },

    updateLockTimeout: function(){
      var that = this;

      clearTimeout(this.lockTimeout);

      if (this.isEditable()) {
        this.lockTimeout = setTimeout(function(){
          that.setLock(false);
        }, 5 * 60 * 1000);
      }
    },

    makeEditable: function(){
      return $.ajax(_.result(this.collection, 'url') + '/edit', {
        type: 'POST',
        data: {
          project_label: this.id
        }
      });
    },

    commission: function(){
      return $.ajax(_.result(this.collection, 'url') + '/commission', {
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

    save: function(key, val, options){
      var that = this,
        attrs = {},
        saveNow;

      // Duplicated in order to get proper options obj.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val || {};
      } else {
        attrs[key] = val;
        options = options || {};
      }

      // Might as well handle this here as well.
      if (attrs && !options.wait) {
        if (!this.set(attrs)) { return false; }
        attrs = null;
      }

      // Clear the lock after saving for existing projects.
      if (!this.isNew() && !options.persistLock) {
        options.success = _.wrap(options.success, function(success, resp){
          that.setLock(false).done(success);
        });
      }

      saveNow = options.immediate && !this.saveTimeout;
      clearTimeout(this.saveTimeout);

      if (options.lazy) {
        this.saveTimeout = setTimeout(function(){
          that.saveTimeout = null;

          if (!options.immediate) {
            Backbone.Model.prototype.save.call(that, attrs, options);
          }
        }, 1000);
      } else {
        saveNow = true;
      }

      if (saveNow) {
        return Backbone.Model.prototype.save.call(this, attrs, options);
      }
    },

    parse: function(resp, options){
      // Check if the response includes devices.
      if (resp.devices && !resp.project_label) {

        this.devices.reset(resp.devices, {
          equipment: options.equipment,
          project: this,
          parse: true
        });

        // Parse relationships.
        _.each(resp.rels, function(rel) {
          var source = this.devices.get(rel[2]),
            target = this.devices.get(rel[0]),
            relationship = rel[1];

          if (!target && rel[0] === resp.project.node_id) {
            target = this;
          }

          if (source && target) {
            source.connectTo(target, relationship);
          }
        }, this);

        // Check rendering information for each device recursivly.
        _.each(_.keys(Equipment.renderings), function(label){
          this.checkOutgoing(this, label);
        }, this);

        resp = resp.project;
      }

      return resp;
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

    addNote: function(note, user, options){
      this.save({
        notes: this.formatNote(note, user) + this.get('notes')
      }, _.extend({lazy: true, persistLock: true}, options));
    },

    formatNote: function(msg, user){
      var now = new Date(),
        when = now.toISOString().replace('T', ' at ').replace(/\.\d+Z$/, '') + ' ';

      user = user || this.user;

      if (user) {
        msg = user.get('name') + ' ' + msg;
      }

      return when + msg + '\n';
    }
  }, {
    schema: {
      site_label: {
        type: 'text',
        required: true,
        editable: false,
        validate: function(value){
          return (/^[A-Z]{3,}$/).test(value);
        }
      },
      display_name: {
        type: 'text',
        required: true,
        validate: function(value){
          return value && value !== '';
        }
      },
      latitude: {
        type: 'number',
        required: true,
        validate: function(value){
          return !isNaN(value);
        }
      },
      longitude: {
        type: 'number',
        required: true,
        validate: function(value){
          return !isNaN(value);
        }
      },
      elevation: {
        type: 'number',
        required: true,
        validate: function(value){
          return !isNaN(value);
        }
      }
    }
  });

  Project.Collection = Backbone.Collection.extend({
    model: Project.Model,
    url: '/api/projects',

    getOrCreate: function(label){
      return this.get(label) || this.push({project_label: label});
    },

    fetchIssues: function(){
      var that = this,
          projectIds = [];

      this.each(function(project){
        projectIds.push(project.id);
      });

      return $.ajax({
        url: '/api/alarms/active/' + projectIds.join(','),
        cache: false,
        type: 'GET',
        dataType: 'json'
      })
      .done(function(data){
        that.trigger('data:done', data);
        that.parseIssues(data);
      });
    },

    parseIssues: function(data){
      var issues = data.alarms;

      this.each(function(project){
        var projectIssues = [];

        _.each(issues, function(issue){
          if (issue.project_label === project.id) {
            projectIssues.push(issue);
          }
        });

        project.issues.reset(projectIssues);
      });
    },

    fetchProjectKpis: function(){
      // Don't fetch data if there are no projects
      if(this.length) {
        var that = this;
        var traces = [];

        this.each(function(project){
          traces.push({
            project_label: project.id,
            project_timezone: project.get('timezone')
          });
        });

        return $.ajax({
          url: '/api/kpis',
          cache: false,
          type: 'POST',
          dataType: 'json',
          data: {
            traces: traces
          }
        })
        .done(function(data){
          that.trigger('data:done', data);
          that.parseProjectKpis(data.response);
        });
      }
    },

    parseProjectKpis: function(data){
      // Loop through returned KPIs and send the data to their respective projects
      _.each(data, function(kpi){
        var project = this.findWhere({project_label: kpi.project_label});

        project.parseKpis(kpi);
      }, this);
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
      this.listenTo(this.model, 'change', this.render);
    }
  });

  Project.views.DataListView = Marionette.CompositeView.extend({
    template: {
      type: 'handlebars',
      template: dataListTemplate
    },
    itemViewContainer: 'tbody',
    itemView: Project.views.DataListItem,
    initialize: function(options){
      this.collection = new Backbone.VirtualCollection(options.collection, {
        close_with: this
      });
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
    modelEvents: {
      'change': 'render'
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

        // This shouldn't have to be here but the markers occassionally end up behind
        // the map layer. This brings focus back to them and makes them visble.
        // There is probably a better solution to this...
        this.highlight();
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
      }),
      Unknown: L.divIcon({
        className: 'unknown',
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
      this.marker.off();
      this.popUp.close();
    },
    remove: function(){
      var that = this;
      this.stopListening();
      this.marker.off();
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
      }).addTo(map);

      this.markers = new L.layerGroup([]);

      this.markers.addTo(this.map);

      this._renderChildren();

      this.fitToBounds();

      this.addLayers();

      this.initFullscreen();

      this.listenTo(Backbone, 'window:resize', this.map.viewreset);
    },

    onClose: function(){
      // Clean up leaflet map
      if (this.map) {
        this.map.remove();
      }
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
    },
    modelEvents: {
      'change': 'render'
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
