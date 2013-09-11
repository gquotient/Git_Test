define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'leaflet',
  'css!leaflet.css',

  'navigation',

  'hbs!project/templates/adminListItem',
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

  adminListItemTemplate,
  adminDetailTemplate,
  adminGeosearchTemplate
){
  var views = {};

  views.AdminListItem = Navigation.views.AdminListItem.extend({
    template: {
      type: 'handlebars',
      template: adminListItemTemplate
    },

    templateHelpers: function(){
      return {
        locked: this.model.isLocked()
      };
    },

    ui: {
      lock: '.lock-icon',
      commission: 'button.commission',
      del: 'button.delete'
    },

    triggers: {
      'click': 'detail',
      'click .lock-icon': 'unlock',
      'click button.commission': 'commission',
      'click button.model': 'editor',
      'click button.delete': 'delete'
    },

    onRender: function(){
      var editable = this.model.isEditable(),
        disabled = !editable && this.model.isLocked();

      this.ui.lock.toggleClass('active', editable);
      this.ui.commission.attr('disabled', disabled);
      this.ui.del.attr('disabled', disabled);
    },

    onUnlock: function(){
      if (this.model.isEditable()) {
        this.model.setLock(false);
      }
    },

    onCommission: function(){
      this.model.commission();
    },

    onEditor: function(){
      Backbone.history.navigate('/admin/projects/' + this.model.id + '/power', true);
    }
  });

  views.AdminList = Navigation.views.AdminList.extend({
    itemView: views.AdminListItem
  });

  views.AdminDetail = Marionette.ItemView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: adminDetailTemplate
    },

    schema: {
      display_name: {
        el: '#name',
        validate: function(value){
          return value && value !== '';
        },
        success: function(value){
          var label;

          if (this.model.isNew() && this.ui.site_label.val() === '') {
            label = _.reduce(value.split(' '), function(memo, word){
              if (memo.length < 8) {
                memo += word.toUpperCase().replace(/[^A-Z]+/g, '');
              }
              return memo;
            }, '');

            this.ui.site_label.val(label).removeClass('invalid');
          }
        }
      },

      site_label: {
        el: '#site_label',
        editable: false,
        parse: function(value){
          return value.toUpperCase().replace(/[^A-Z]+/g, '');
        },
        validate: function(value){
          return (/^[A-Z]{3,}$/).test(value);
        }
      },

      address: {
        el: '#address'
      },

      city: {
        el: '#city'
      },

      state: {
        el: '#state'
      },

      zipcode: {
        el: '#zipcode'
      },

      description: {
        el: '#description'
      },

      latitude: {
        el: '#latitude',
        parse: function(value){
          return parseFloat(value);
        },
        validate: function(value){
          return !isNaN(value);
        },
        success: function(value){
          this.model.set({latitude: value});
        }
      },

      longitude: {
        el: '#longitude',
        parse: function(value){
          return parseFloat(value);
        },
        validate: function(value){
          return !isNaN(value);
        },
        success: function(value){
          this.model.set({longitude: value});
        }
      },

      elevation: {
        el: '#elevation',
        parse: function(value){
          return parseFloat(value);
        },
        validate: function(value){
          return !isNaN(value);
        }
      }
    },

    initialize: function(){
      this.changed = {};
    },

    ui: function(){
      return _.reduce(this.schema, function(memo, obj, key){
        memo[key] = obj.el;

        return memo;
      }, {});
    },

    events: function(){
      return _.reduce(this.schema, function(memo, obj, key){
        memo['blur ' + obj.el] = function(){
          var $el = this.ui[key],
            value = $el.val().trim();

          if (obj.parse) {
            value = obj.parse.call(this, value);
          }

          if (obj.validate && !obj.validate.call(this, value)) {
            $el.addClass('invalid');

            if (obj.error) {
              obj.error.call(this, value);
            }
          } else {
            $el.removeClass('invalid');

            this.changed[key] = value;

            if (obj.success) {
              obj.success.call(this, value);
            }
          }
        };

        return memo;
      }, {});
    },

    modelEvents: {
      'change': 'render',
      'destroy': 'close'
    },

    onRender: function(){
      var locked = this.model.isLocked() && !this.model.isEditable(),
        existing = !this.model.isNew();

      _.each(this.schema, function(obj, key){
        var $el = this.ui[key];

        // Skip if no matching element.
        if (!$el) { return; }

        // Disable the element if not editable.
        if (locked || (existing && obj.editable === false)) {
          $el.attr('disabled', true);
        }
      }, this);

      this.changed = {};
    },

    isValid: function(){
      this.$el.find('input textarea').blur();
      return !this.$el.find('.invalid').length;
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

      if ((lat || lat === 0) && (lng || lng === 0)) {
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
      if (this.map) {
        this.map.fitBounds(this.collection.map(this.parseLocation));
      }
    },

    addMarker: function(model){
      var loc = this.parseLocation(model), marker;

      if (loc && this.map  && !this.markers[model.cid]) {
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
