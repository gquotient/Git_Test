define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'leaflet',
  'css!leaflet.css',

  'navigation',
  'form',

  'hbs!project/templates/adminListItem',
  'hbs!project/templates/adminProdListItem',
  'hbs!project/templates/adminEditListItem',
  'hbs!project/templates/adminDetail',
  'hbs!project/templates/adminGeosearch'
], function(
  $,
  _,
  Backbone,
  Marionette,

  L,
  leafletCSS,

  Navigation,
  Form,

  adminListItemTemplate,
  adminProdListItemTemplate,
  adminEditListItemTemplate,
  adminDetailTemplate,
  adminGeosearchTemplate
){
  var views = {};

  views.AdminListItem = Marionette.ItemView.extend({
    tagName: 'tr',
    template: {
      type: 'handlebars',
      template: adminListItemTemplate
    },

    templateHelpers: function(){
      var display_name = this.model.get('display_name'),
        isLocked = this.model.isLocked(),
        isEditable = this.model.isEditable();

      if (!display_name) {
        display_name = this.model.get('project_label').replace(/_\d+$/, '').toLowerCase();
      }

      return {
        display_name: display_name,
        hasImporting: this.model.has('importing'),
        isImporting: this.model.isImporting(),
        isLocked: isLocked,
        isEditable: isEditable,
        isDisabled: isLocked && !isEditable
      };
    },

    triggers: {
      'click': 'detail',
      'click button.model': 'model',
      'click button.delete': 'delete'
    },

    modelEvents: {
      'change': 'render'
    },

    onModel: function(){
      Backbone.history.navigate('/admin/projects/' + this.model.id + '/power', true);
    },

    onDelete: function(){
      if (window.confirm('Are you sure you want to delete this item?')) {
        this.model.destroy({wait: true});
      }
    }
  });

  views.AdminEditListItem = views.AdminListItem.extend({
    template: {
      type: 'handlebars',
      template: adminEditListItemTemplate
    },

    triggers: {
      'click': 'detail',
      'click .lock-icon': 'unlock',
      'dblclick .lock-icon': 'unlock:force',
      'click button.commission': 'commission',
      'click button.model': 'model',
      'click button.delete': 'delete'
    },

    onUnlock: function(){
      if (this.model.isEditable()) {
        this.model.setLock(false);
      }
    },

    onUnlockForce: function(){
      if (this.model.isLocked()) {
        this.model.setLock(false, true);
      }
    },

    onCommission: function(){
      var project = this.model;

      // This clones the project to the StagedProjects index, so fetch the
      // new project and remove this one.
      project.commission().done(function(){
        project.collection.fetchFromIndex('StagedProjects');
        project.destroy({wait: true});
      });
    }
  });

  views.AdminProdListItem = views.AdminListItem.extend({
    template: {
      type: 'handlebars',
      template: adminProdListItemTemplate
    },

    triggers: {
      'click': 'detail',
      'click button.edit': 'edit',
      'click button.model': 'model',
      'click button.delete': 'delete'
    },

    onEdit: function(){
      var project = this.model;

      // This clones the project to the AlignedProjects index, so fetch the
      // new project.
      project.makeEditable().done(function(){
        project.collection.fetchFromIndex('AlignedProjects');
      });
    }
  });

  views.AdminList = Navigation.views.AdminList.extend({
    itemView: views.AdminListItem,

    categories: [
      {
        name: 'Editable',
        filter: {
          index_name: [
            'AlignedProjects'
          ]
        }
      },
      {
        name: 'Importing',
        filter: {
          index_name: [
            'HybridProjects',
            'SentalisProjects',
            'ClarityProjects'
          ]
        }
      },
      {
        name: 'Production',
        filter: {
          index_name: [
            'StagedProjects'
          ]
        }
      },
      {
        name: 'All'
      }
    ],

    getItemView: function(item){
      var index_name = item.get('index_name');

      if (index_name === 'AlignedProjects') {
        return views.AdminEditListItem;
      }

      if (index_name === 'StagedProjects') {
        return views.AdminProdListItem;
      }

      return this.itemView;
    },

    onShow: function(){
      var category = this.categories.first();

      this.triggerMethod('change:category', category);
    },

    onChangeCategory: function(model){
      this.triggerMethod('filter', model.get('filter'));
    }
  });

  views.AdminDetail = Form.views.Admin.extend({
    template: {
      type: 'handlebars',
      template: adminDetailTemplate
    },

    modelEvents: {
      'change:editor': 'render',
      'destroy': 'close'
    },

    editable: function(){
      return !this.model.isLocked() || this.model.isEditable();
    },

    schema: {
      display_name: {
        el: '#name',
        success: function(value){
          var site_label;

          // Generate a site label from the project name if not set.
          if (this.model.isNew() && !this.changed.site_label) {
            site_label = _.reduce(value.split(' '), function(memo, word){
              if (memo.length < 8) {
                memo += word.toUpperCase().replace(/[^A-Z]+/g, '');
              }
              return memo.substr(0, 10);
            }, '');

            this.updateValues({site_label: site_label});
            this.changed.site_label = site_label;
          }
        }
      },
      site_label: {
        tabSkip: true,
        parse: function(value){
          return value.toUpperCase();
        },
        success: function(value){
          this.updateValues({site_label: value});
        }
      },
      sentalis_id: {
        DropdownView: Form.views.InputDropdown.extend({
          updateFilter: function(){
            var input = this.parseInput().toLowerCase();

            this.collection.updateFilter(function(model){
              return input &&
                (model.get('name').indexOf(input) === 0 ||
                 model.get('id').indexOf(input) === 0 ||
                 model.get('slug').indexOf(input) === 0);
            });
          }
        }),
        source: function(){
          // Create the collection if a cached version doesn't exist.
          if (!this.sentalisProjects) {
            this.sentalisProjects = this.fetchSentalisProjects();
          }

          return this.sentalisProjects;
        }
      },
      dm_push: {},
      ia5_push: {},
      address: {},
      city: {},
      state: {},
      zipcode: {},
      latitude: {
        success: function(value){
          this.model.set({latitude: value});
        }
      },
      longitude: {
        success: function(value){
          this.model.set({longitude: value});
        }
      },
      elevation: {},
      description: {}
    },

    ui: {
      'import': 'button.import'
    },

    triggers: {
      'click button.import': 'import'
    },

    onShow: function(){
      if (this.model.isNew()) {
        Backbone.history.navigate('/admin/projects');
      } else {
        Backbone.history.navigate('/admin/projects/' + this.model.id);
      }
    },

    onRender: function(){
      // If the project is not editable then disable all the buttons.
      if (!this.editable()) {
        this.$('button').attr('disabled', true);
      }
    },

    onSave: function(){
      if (this.model.isNew()) {
        this.model.addNote('created project');
      }

      this.saveChanges();
    },

    onImport: function(){
      // The Sentalis ID is required for this operation.
      this._schema.sentalis_id.required = true;

      // Make sure the values are valid and store them on the model.
      if (this.isInvalid('site_label', 'sentalis_id')) { return false; }
      this.model.set(this.changed);

      this.toggleLoadingIndicator('import', true);

      // Initiate the project import.
      this.model.importFromSentalis()
      .done(_.bind(function(){
        this.triggerMethod('import:started', this.model);
      }, this))
      .always(_.bind(function(){
        this.toggleLoadingIndicator('import');
      }, this));
    },

    fetchSentalisProjects: function(){
      var collection = new Backbone.Collection();

      // Fetch the project list from sentalis.
      $.ajax({
        url: this.collection.url + '/sentalis',
        type: 'GET',
        dataType: 'json'
      })
      .done(function(resp){
        // Convert the list of projects into model attrs.
        collection.reset(_.map(resp, function(project){
          var parts = project.split('-');

          return {
            name: project,
            id: parts[0],
            slug: parts.slice(1).join('-')
          };
        }));
      });

      return collection;
    }
  });

  views.AdminGeosearch = Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: adminGeosearchTemplate
    },

    className: 'geosearch',

    ui: {
      input: 'input'
    },

    events: {
      'keyup': function(e){
        switch (e.which) {
        case 13:
          this.geosearch(this.ui.input.val());
          break;

        case 27:
          this.ui.input.val('');
          this.ui.input.blur();
          break;
        }
      },

      'mousedown input': function(e){
        e.stopPropagation();
      }
    },

    geosearch: _.throttle(function(query){
      var that = this;

      $.ajax('http://nominatim.openstreetmap.org/search', {
        dataType: 'json',
        data: {
          q: query,
          limit: 1,
          format: 'json',
          addressdetails: true
        },
        timeout: 3000
      }).done(function(data){
        if (data.length > 0) {
          that.trigger('found', data[0]);
        } else {
          window.alert('No address matches your query');
        }
      }).fail(function(jqxhr, stat){
        window.alert('Address search failed (' + stat + ')');
      });
    }, 1000)
  });

  views.AdminMap = Marionette.View.extend({
    initialize: function(){
      this.markers = {};

      this.geosearch = new views.AdminGeosearch();

      this.listenTo(this.geosearch, 'found', function(loc){
        this.trigger('locate', {
          address: _.compact([
            loc.address.house_number,
            loc.address.road
          ]).join(' '),
          city: loc.address.city,
          state: loc.address.state,
          zipcode: loc.address.postcode,
          latitude: parseFloat(loc.lat),
          longitude: parseFloat(loc.lon)
        });
      });
    },

    collectionEvents: {
      'add': 'addMarker',
      'remove': 'removeMarker',
      'reset': 'resetMarkers'
    },

    onShow: function(){
      this.map = L.map(this.el, {
        layers: [
          L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>',
            opacity: 0.99
          })
        ],
        // Center on the US by default.
        center: [39.8, -98.6],
        zoom: 3
      });

      this.$el.append( this.geosearch.render().el );
      this.resetMarkers();
    },

    onClose: function(){
      this.map.remove();
    },

    parseLocation: function(model){
      var lat, lng;

      if (model instanceof Backbone.Model) {
        lat = model.get('latitude');
        lng = model.get('longitude');

      } else if (_.isArray(model)) {
        lat = model[0];
        lng = model[1];

      } else if (_.isObject(model)) {
        lat = model.latitude;
        lng = model.longitude;
      }

      if (!_.isUndefined(lat) && !_.isUndefined(lng)) {
        return [lat, lng];
      }
    },

    focusMap: function(model){
      var loc = this.parseLocation(model),
        zoom = this.map.getZoom();

      if (loc && this.map) {
        if (zoom < 10) {
          this.map.setZoom(15);
        }

        this.map.panTo(loc);
      }
    },

    centerMap: function(){
      if (this.map && this.collection.length) {
        this.map.fitBounds(this.collection.map(this.parseLocation));
      }
    },

    addMarker: function(model){
      var loc = this.parseLocation(model), marker;

      if (loc && this.map && !this.markers[model.cid]) {
        marker = this.markers[model.cid] = L.marker(loc, {
          title: model.get('display_name'),
          draggable: model.isNew(),
          icon: L.divIcon({
            className: 'ok',
            iconSize: [15,32]
          })
        });

        this.listenTo(model, 'change:latitude change:longitude', function(){
          var loc = this.parseLocation(model);

          if (loc) {
            marker.setLatLng(loc);
            this.focusMap(loc);
          }
        });

        marker.on('click', function(){
          this.trigger('select', model);
        }, this);

        marker.on('dragend', function(){
          var loc = marker.getLatLng();

          this.trigger('locate', {
            latitude: loc.lat,
            longitude: loc.lng
          }, model);
        }, this);

        marker.addTo(this.map);
      }
    },

    removeMarker: function(model){
      var marker = this.markers[model.cid];

      if (marker) {
        this.stopListening(model);
        this.map.removeLayer(marker);
        delete this.markers[model.cid];
      }
    },

    resetMarkers: function(collection, options){
      options = options || {};
      _.each(options.previousModels, this.removeMarker, this);
      this.collection.each(this.addMarker, this);
    }
  });

  return views;
});
