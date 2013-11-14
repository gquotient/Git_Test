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
      statusValue: -1
    },

    constructor: function(){
      // Need these initialized here for parsing.
      this.devices = new Device.Collection();
      this.outgoing = new Device.Collection();

      Backbone.Model.prototype.constructor.apply(this, arguments);
    },

    initialize: function(attrs, options){
      this.issues = new Issue.Collection([], {project: this});

      // This might be a bit convoluted and potentially fire too often but it works
      this.listenTo(this.issues, 'change reset add remove', function(){
        var status = this.issues.getSeverity();
        this.set(status);
      });
    },

    getAttributes: function(){
      return _.extend({}, this.attributes);
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

    parse: function(resp, options){

      // Check if the response includes devices.
      if (resp.devices && !resp.project_label) {
        this.devices.reset(this.parseDevices(resp, options), {
          equipment: options.equipment || this.equipment,
          project: this,
          parse: true,
          silent: true
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

        // Wait to trigger the reset.
        this.devices.trigger('reset', this);

        resp = resp.project;
      }

      // Force node_id to always be a string.
      resp.node_id = '' + resp.node_id;

      return resp;
    },

    parseDevices: function(resp, options){
      var labels = resp.labels || {};

      return _.map(resp.devices, function(device){
        var graph_key = device.graph_key;

        if (graph_key && _.has(labels, graph_key)) {
          device.display_name = labels[graph_key];
        }

        return device;
      });
    }
  });

  Project.Collection = Backbone.Collection.extend({
    model: Project.Model,
    url: '/api/projects',

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
        if (project) {
          project.parseKpis(kpi);
        }
      }, this);
    }
  });

  Project.AdminModel = Project.Model.extend({
    idAttribute: 'node_id',

    defaults: {
      index_name: 'AlignedProjects',
      rollup_intervals: '',
      ac_capacity: 0,
      dc_capacity: 0,
      capacity_units: 'watts',
      surface_area: 0,
      dm_push: false,
      elevation: 0,
      notes: ''
    },

    initialize: function(attrs, options){
      this.equipment = options.equipment || (this.collection || {}).equipment;
      this.user = options.user || (this.collection || {}).user;

      this.on('change:editor', this.updateLockTimeout);
      this.updateLockTimeout();
    },

    url: function(){
      var base = this.collection.url;
      if (this.isNew()) { return base; }
      return base + '/' + this.get('project_label');
    },

    sync: function(method, model, options){
      // Add the index_name to get and delete requests.
      if (!options.data && (method === 'read' || method === 'delete')) {
        options.data = {index_name: model.get('index_name')};
        options.dataType = 'json';

        // jQuery doesn't properly handle body data for delete.
        if (method === 'delete') {
          options.data = JSON.stringify(options.data);
          options.contentType = 'application/json';
        }
      }

      Backbone.sync.call(this, method, model, options);
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
      if (!this.isNew() && options.clearLock !== false) {
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

    makeEditable: function(){
      return $.ajax(_.result(this.collection, 'url') + '/edit', {
        type: 'POST',
        data: {
          project_label: this.get('project_label'),
          index_name: this.get('index_name')
        }
      });
    },

    commission: function(){
      return $.ajax(_.result(this.collection, 'url') + '/commission', {
        type: 'POST',
        data: {
          project_label: this.get('project_label'),
          index_name: this.get('index_name')
        }
      });
    },

    getSchema: function(){
      return this.constructor.schema;
    },

    isImporting: function(){
      var msg = 'was successfully translated';
      return this.has('importing') && this.get('importing').indexOf(msg) < 0;
    },

    isLocked: function(){
      if (this.isImporting()) { return true; }
      if (!this.has('editor')) { return false; }
      return this.get('editor') !== 'unlocked';
    },

    isEditable: function(){
      if (this.isImporting()) { return false; }
      if (!this.has('editor')) { return false; }
      return this.get('editor') === this.user.get('email');
    },

    setLock: function(lock){
      return $.ajax(_.result(this, 'url') + '/edit', {
        type: 'PUT',
        data: {
          project_label: this.get('project_label'),
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

    addNote: function(note, user, options){
      this.save({
        notes: this.formatNote(note, user) + this.get('notes')
      }, _.extend({lazy: true, clearLock: false}, options));
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
        required: true,
        editable: false,
        validate: function(value){
          // Labels must start with a letter followed by letters and numbers
          // and be between 3 and 10 characters long.
          return (/^[A-Z][A-Z0-9]{2,9}$/).test(value);
        }
      },
      display_name: {
        required: true
      },
      sentalis_id: {
        editable: false
      },
      dm_push: {
        type: 'boolean'
      },
      ia5_push: {
        type: 'boolean'
      },
      latitude: {
        type: 'number',
        required: true
      },
      longitude: {
        type: 'number',
        required: true
      },
      elevation: {
        type: 'number',
        required: true
      }
    }
  });

  Project.AdminCollection = Backbone.Collection.extend({
    model: Project.AdminModel,
    url: '/api/projects',

    initialize: function(models, options){
      this.equipment = options.equipment;
      this.user = options.user;
    },

    getOrCreate: function(obj){
      return this.get(obj) || this.push(obj);
    },

    // Overwritten to check node_id and project label as well.
    get: function(obj){
      if (!obj) { return void 0; }
      return this._byId[obj.node_id] || this._byId[obj.id] ||
        this._byId[obj.cid] || this._byId[obj] || this.getByLabel(obj);
    },

    getByLabel: function(obj, index_name){
      // If Backbone model then use it's attributes.
      if (obj instanceof Backbone.Model) {
        obj = obj.attributes;

      // Otherwise if non-object then assume it is a label.
      } else if (!_.isObject(obj)) {
        obj = {project_label: obj};
      }

      return this.findWhere({
        project_label: obj.project_label,
        index_name: index_name || obj.index_name
      });
    },

    fetchFromIndex: function(index_name, options){
      return $.ajax({
        url: this.url,
        type: 'GET',
        data: {index_name: index_name},
        dataType: 'json'
      })
      .done(_.bind(function(resp){
        // Add the index name to each project.
        resp = _.map(resp, function(attrs){
          return _.extend(attrs, {index_name: index_name});
        });

        this.set(resp, _.extend({parse: true, remove: false}, options));
      }, this));
    },

    fetchImporting: function(){
      return $.ajax({
        url: this.url + '/importing',
        type: 'GET',
        dataType: 'json'
      })
      .done(_.bind(function(resp){
        _.each(resp.status, function(msg, label){
          var project = this.getByLabel(label, 'SentalisProjects') ||
                        this.getByLabel(label, 'AlignedProjects');

          // Convert the msgs into a single string and remove dividers.
          if (_.isArray(msg)) {
            msg = _.reject(msg, function(line){
              return (/^-+$/).test(line);
            }).join('\n');
          }

          // If the project exists then update the message.
          if (project) {
            project.set({importing: msg});

          // Otherwise create a new project.
          } else {
            this.push({
              project_label: label,
              index_name: 'AlignedProjects',
              importing: msg
            });
          }
        }, this);
      }, this));
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
        comparator: 'display_name',
        close_with: this
      });
    }
  });

  Project.views.DashboardItemView = Marionette.ItemView.extend({
    className: 'projectStatus',
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
      var el = this.el;

      // Save fullscreen method
      this.fullscreen.activate = el.webkitRequestFullScreen || el.mozRequestFullScreen || el.requestFullScreen;

      // Save exit fullscreen method
      this.fullscreen.close = document.webkitExitFullScreen || document.mozCancelFullScreen || document.exitFullScreen;

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

  Project.views.NavigationListView = Navigation.views.List.extend({
    template: {
      type: 'handlebars',
      template: navigationListTemplate
    },
    ui: _.extend({}, Navigation.views.List.prototype.ui, {
      sort: '.sortSelect'
    }),
    itemView: Project.views.NavigationListItemView,
    events: {
      'change .sortSelect': function(event){
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
