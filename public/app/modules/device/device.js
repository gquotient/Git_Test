define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'navigation',
  './canvas',
  './table',

  'hbs!device/templates/li',
  'hbs!device/templates/ul'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Navigation,
  Canvas,
  Table,

  deviceListItemViewTemplate,
  deviceListViewTemplate
){
  var Device = { views: {} };

  Device.Model = Backbone.Model.extend({
    idAttribute: 'node_id',
    url: '/api/devices',

    initialize: function(attrs, options){
      options = options || {};

      if (options.equipment) {
        this.equipment = options.equipment.findOrCreateForDevice(this);
      }

      if (!this.has('name') && this.equipment) {
        this.set({name: this.equipment.generateName(this)});
      }

      if (options.project) {
        this.set({project_label: options.project.id});
      }

      this.relationships = {};

      this.outgoing = new Device.Collection();
      this.incoming = new Device.Collection();

      this.listenTo(this.incoming, 'remove', function(model){
        delete this.relationships[model.cid];
      });

      this.lazySave = _.debounce(Backbone.Model.prototype.save, 1000);
    },

    connectTo: function(target, rel){
      if (!_.has(this.relationships, target.cid)) {
        this.relationships[target.cid] = rel;

        this.incoming.add(target);
        target.outgoing.add(this);
      }
    },

    disconnectFrom: function(target){
      if (_.has(this.relationships, target.cid) && _.size(this.relationships) > 1) {
        delete this.relationships[target.cid];

        this.incoming.remove(target);
        target.outgoing.remove(this);
      }
    },

    getRelationship: function(target){
      return this.relationships[target.cid];
    },

    hasChild: function(target, rel){
      return this.outgoing.any(function(device){
        if (device.getRelationship(this) === rel) {
          return device === target || device.hasChild(target, rel);
        }
      }, this);
    },

    getPosition: function(label){
      var renderings = this.get('renderings');

      return renderings && _.clone(renderings[label]);
    },

    setPosition: function(label, position, save){
      var renderings = _.clone(this.get('renderings')) || {}, evnt;

      if (position) {
        if (!_.has(renderings, label)) {
          evnt = 'rendering:add';
        } else if (_.isEqual(renderings[label], position)) {
          return;
        }
        renderings[label] = position;
      } else {
        evnt = 'rendering:remove';
        delete renderings[label];
      }

      this.set({renderings: renderings});

      if (save) {
        this.lazySave();
      }

      if (evnt) {
        this.trigger(evnt, this);
      }
    },

    parse: function(resp, options){
      var rend = resp.renderings;

      // Only use the server position data when the device is created.
      if (this.isNew()) {
        resp.renderings = _.isString(rend) ? JSON.parse(rend) : rend || {};

      // Otherwise prevent overwriting the client position data.
      } else {
        delete resp.renderings;
      }

      return resp;
    }
  });

  Device.Collection = Backbone.Collection.extend({
    model: Device.Model,
    comparator: function(device){
      var did = device.get('did'),
          didPieces, comparator;

      if (did) {
        comparator = did;
        didPieces = did.split('-');

        // Use the number in the did for sorting if one exists
        _.each(didPieces, function(piece){
          if (typeof +piece === 'number') {
            comparator = +piece;
          }
        });
      }

      return comparator;
    }
  });

  Device.views.DeviceListItem = Navigation.views.ListItem.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: deviceListItemViewTemplate
    },
    className: 'device collapsed',
    expanded: false,
    events: {
      'click .label': function(event){
        event.stopPropagation();

        Backbone.trigger('click:device', this.model);
      },
      'click .expand': function(event){
        event.stopPropagation();
        this.toggleExpand();
      }
    },
    setActive: function(){
      this.$el.addClass('active');

      this.propagateExpand();
    },
    toggleExpand: function(){
      if (this.expanded) {
        this.$el.removeClass('expanded');
        this.$el.addClass('collapsed');
        this.expanded = false;
      } else {
        this.$el.removeClass('collapsed');
        this.$el.addClass('expanded');
        this.expanded = true;
      }
    },
    propagateExpand: function(){
      if (!this.expanded && !this.$el.hasClass('active')) {
        this.toggleExpand();
      }

      this.trigger('expand');
    },
    onRender: function(){
      if (this.model.outgoing.length) {
        // Create new collection
        var filteredDevices = this.model.outgoing.filter(function(device){
          var devtype = device.get('devtype');

          return devtype && devtype !== 'Draker Panel Monitor' && devtype !== 'AC Bus';
        });

        // Only build children if whitelisted devices exist
        if (filteredDevices.length) {
          var devices = new Device.Collection();

          // Add expand-o-matic
          this.$el.find('> .label').append('<span class="expand">Expand</span>');

          // Make sure models have a devtype and push them to devices
          devices.reset(filteredDevices);

          // Create a new collection view with this device's chidren
          this.children = new Device.views.NavigationList({
            collection: devices,
            className: 'devices'
          });

          // Render the view so the element is available
          this.children.render();

          this.listenTo(this.children, 'expand', this.propagateExpand);

          // Append the child element to this view
          this.$el.append(this.children.$el);
        }
      }
    },
    onClose: function(){
      // Close children view
      if (this.children) {
        this.children.close();
      }
    }
  });

  Device.views.NavigationList = Navigation.views.List.extend({
    itemView: Device.views.DeviceListItem,
    className: 'devices hidden',
    onRender: function(){
      this.listenTo(this, 'itemview:expand', function(){
        this.trigger('expand');
      });
    },
    propagateActive: function(options) {
      this.setActive(options);

      if (this.children) {
        this.children.each(function(child){
          if (child.children) {
            child.children.propagateActive(options);
          }
        });
      }
    }
  });

  _.extend(Device.views, {
    Canvas: Canvas,
    Table: Table
  });

  return Device;
});
