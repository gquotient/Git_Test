define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'leaflet',
  'css!leaflet.css', //This seems silly but also seems to work, sooooo...

  'device',
  './editor',
  'issue',

  'hbs!project/templates/dataList',
  'hbs!project/templates/dataListItem',
  'hbs!project/templates/dashboardItem',
  'hbs!project/templates/create',
  'hbs!project/templates/navigationItemView',
  'hbs!project/templates/projectList',
  'hbs!project/templates/markerPopUp',
  'hbs!project/templates/kpis',
  'hbs!project/templates/changelog'
], function(
  $,
  _,
  Backbone,
  Marionette,

  L,
  leafletCSS,

  Device,
  Editor,
  Issue,

  dataListTemplate,
  dataListItemTemplate,
  dashboardItemTemplate,
  createTemplate,
  navigationItemViewTemplate,
  navigationListTemplate,
  markerPopUpTemplate,
  kpisTemplate,
  changelogTemplate
){
  var Project = { views: {Editor: Editor} };

  Project.Model = Backbone.Model.extend({
    idAttribute: 'project_label',
    url: '/api/projects',
    defaults: {
      type: 'project',
      kpis: {
        irradiance: 0,
        power: 0,
        dpi: 0,
        energyYTD: {
          generated: 0,
          forecast: 0,
          modeled: 0
        }
      },
      energySources: [
        'pgen-acm',
        'pgen-rm',
        'pgen-util'
      ],
      changelog: ''
    },

    initialize: function(){
      this.devices = new Device.Collection();
      this.outgoing = new Device.Collection();
    },

    issues: new Issue.Collection({projectId: this.id}),

    fetchKpis: function(){
      var that = this;

      return $.ajax({
        url: '/api/snapshot',
        cache: false,
        type: 'POST',
        dataType: 'json',
        data: {
          traces: [
            {
              'project_label': this.id,
              'ddl': 'pgen-env',
              'columns': ['irradiance']
            },
            {
              'project_label': this.id,
              'ddl': 'pgen-acm',
              'columns': ['ac_power']
            },
            {
              'project_label': this.id,
              'ddl': 'pgen-rm',
              'columns': ['ac_power']
            },
            {
              'project_label': this.id,
              'ddl': 'pgen-util',
              'columns': ['ac_power']
            }
          ]
        }
      })
      .done(function(data){
        that.trigger('data:done', data);
        that.parseKpis(data.response);
      });
    },

    parseKpis: function(data){
      var kpis = {
        irradiance: 0,
        power: 0,
        dpi: 0,
        energyYTD: {
          generated: 0,
          forecast: 0,
          modeled: 0
        }
      };

      _.each(data, function(kpi, index){
        if (kpi.columns) {
          var dataType = kpi.columns[0];

          // Set irradiance kpi
          if (dataType === 'irradiance') {
            kpis.irradiance = kpi.data[0][0];
          }

          // Select first available power snapshot
          if (dataType === 'ac_power' && kpis.power === 0) {
            kpis.power = kpi.data[0][0];
          }
        }
      });

      // DPI cheat
      if (kpis.power > 0 && kpis.irradiance) {
        kpis.dpi = (kpis.power / kpis.irradiance) / (this.get('ac_capacity')) * 100;
      }

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
    whichEnergy: function(){
      var
        that = this,
        defer = $.Deferred(),
        ddls = this.get('ddls'),
        whichEnergy = function(){
          var sources = that.get('energySources');

          for(var source=0, sourcesLength=sources.length; source<=sourcesLength; source++){
            // Add '_300' to the string for now since that's how it is in the ddls
            if (_.has(ddls, sources[source] + '_300')) {
              return sources[source];
            }
          }
        }
      ;

      if (ddls) {
        // Model already has DDLs, resolve the defer with the correct energy
        defer.resolve(whichEnergy());
      } else {
        // Else, fetch the DDLs and resolve the chain
        this.fetchDDLs().done(function(data){
          ddls = data.ddls;

          if (ddls) {
            defer.resolve(whichEnergy());
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
        this.devices.reset(resp.devices);

        if (options.equipment) {
          this.devices.each(function(device){
            var equip = options.equipment.findForDevice(device);

            if (equip) {
              device.equipment = equip;
              device.trigger('equipment:add', device);
            }
          });
        }

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
      }

      return _.omit(resp, 'devices', 'rels');
    },

    validate: function(attrs){
      if (
        attrs.name === '' ||
        attrs.site_label === '' ||
        isNaN(attrs.latitude) ||
        isNaN(attrs.longitude) ||
        isNaN(attrs.elevation)
      ) { return 'error'; }
    },

    log: function(msg, user){
      var log = this.get('changelog'),
        now = new Date(),
        when = now.toISOString().replace('T', ' at ').replace(/\.\d+Z$/, '') + ' ',
        who = user ? user.get('name') + ' ' : '';

      this.set({changelog: when + who + msg + '\n' + log});
      this.lazySave();
    },

    lazySave: _.debounce(Backbone.Model.prototype.save, 1000)
  });

  Project.Collection = Backbone.Collection.extend({
    model: Project.Model
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
    },
    events: {
      'click': function(){
        Backbone.history.navigate('/project/'+this.model.id, true);
      }
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
      }
    },
    initialize: function(options){
      this.render();
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

      // Instantiate pop up content
      this.popUp = new Project.views.MarkerPopUp({model: this.model});
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
          layer.layer.redraw();
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

      this.listenTo(Backbone, 'window:resize', this.map.viewreset);
    },

    events: {
      'click .layerControl': function(event){
        this.toggleLayer(event.target.id.split('_')[1]);
      }
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
      var project = this.model;

      project.save({
        name: this.ui.name.val().trim(),
        site_label: this.ui.label.val().replace(/\W|_/g, ''),
        latitude: parseFloat(this.ui.latitude.val()),
        longitude: parseFloat(this.ui.longitude.val()),
        elevation: parseFloat(this.ui.elevation.val()) || 0
      }).done(_.bind(function(){
        Backbone.trigger('create:project', project);

        project.log('created project', this.options.user);
      }, this));
    },

    onReset: function(){
      this.render();
    }
  });

   /* The item view is the view for the individual portfolios in the navigation. */
  Project.views.NavigationItemView = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: navigationItemViewTemplate
    },
    attributes: {
      class: 'nav-item hidden'
    },
    onRender: function(){
      var that = this;
      setTimeout(function(){ that.$el.removeClass('hidden'); }, 0);
    },
    events: {
      'click': function(){
        Backbone.trigger('click:project', this.model);
      }
    }
  });

  /* This composite view is the wrapper view for the list of portfolios.
     It handles nesting the list while allowing for the navigation header. */
  Project.views.NavigationListView = Marionette.CompositeView.extend({
    tagName: 'div',
    attributes: {
      class: 'projects'
    },
    template: {
      type: 'handlebars',
      template: navigationListTemplate
    },

    itemViewContainer: '.project-list',

    // Tell the composite view which view to use as for each portfolio.
    itemView: Project.views.NavigationItemView,

    events: {
      'change #project-sort': function(){
        this.collection.comparator = $('#project-sort').val();
        this.collection.sort();
      }
    },

    initialize: function(options){
      this.listenTo(Backbone, 'select:project', this.setProject);
      this.listenTo(this.collection, 'sort', this._renderChildren);
    },

    // Setup the views for the current model.
    setPortfolio: function(model){
      // Set the current collection to be a new navigation list with the subPortfolios.
      this.collection = model.portfolios;

      // Trigger a render. This forces the nav header to update, too.
      this.render();
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

  Project.views.ChangeLog = Marionette.ItemView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: changelogTemplate
    },

    attributes: {
      id: 'changelog'
    },

    ui: {
      textarea: 'textarea'
    },

    events: {
      'keyup textarea': function(e){
        this.model.set('changelog', this.ui.textarea.val());

        if (e.which === 27) {
          this.ui.textarea.blur();
        }
      },

      'blur textarea': function(){
        this.model.save();
      }
    },

    modelEvents: {
      'change:changelog': function(){
        this.ui.textarea.val(this.model.get('changelog'));
      }
    },

    onClose: function(){
      this.model.save();
    }
  });

  return Project;
});
