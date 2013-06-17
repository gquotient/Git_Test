define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  './canvas',

  'hbs!device/templates/li',
  'hbs!device/templates/ul'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Canvas,

  deviceListItemViewTemplate,
  deviceListViewTemplate
){
  var Device = { views: {} };

  Device.Model = Backbone.Model.extend({
    url: '/api/devices',
    defaults: {
      renderings: {}
    },

    initialize: function(){
      this.relationships = {};

      this.outgoing = new Device.Collection();
      this.incoming = new Device.Collection();
    },

    getRelationship: function(target){
      return this.relationships[target.id];
    },

    getPosition: function(view){
      var renderings = this.get('renderings');

      return _.clone(renderings[view]);
    },

    setPosition: function(view, position, save){
      var renderings = _.clone(this.get('renderings')),
        isNew = !_.has(renderings, view);

      if (isNew || !_.isEqual(renderings[view], position)) {
        renderings[view] = position;
        this[save ? 'save' : 'set']({renderings: renderings});
      }

      if (isNew) {
        this.trigger('add:rendering', this);
      }
    },

    connectTo: function(target, label){
      if (!_.has(this.relationships, target.id)) {
        this.relationships[target.id] = label;

        this.incoming.add(target);
        target.outgoing.add(this);
      }
    },

    disconnectFrom: function(target){
      if (_.has(this.relationships, target.id) && _.size(this.relationships) > 1) {
        delete this.relationships[target.id];

        this.incoming.remove(target);
        target.outgoing.remove(this);
      }
    },

    hasChild: function(child, relationship){
      var rel = child.relationships[this.id];

      if (rel && (!relationship || relationship === rel)) {
        return true;
      } else {
        return this.outgoing.any(function(model){
          return model.hasChild(child, relationship);
        });
      }
    }
  });

  Device.Collection = Backbone.Collection.extend({
    model: Device.Model,

    next: function(model){
      var index = this.indexOf(model);
      return (index !== -1 && this.at(index + 1)) || this.first();
    },

    previous: function(model){
      var index = this.indexOf(model);
      return this.at(index - 1) || this.last();
    }
  });

  Device.views.Canvas = Canvas;

  Device.views.DeviceListItem = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: deviceListItemViewTemplate
    },
    attributes: {
      class: 'device'
    },
    events: {
      'click a': function(event){
        event.preventDefault();
        event.stopPropagation();

        Backbone.trigger('click:device', this.model);
      },
      'click .expand': function(event){
        event.preventDefault();
        event.stopPropagation();

        console.log('expand');
      }
    },
    onRender: function(){
      if (this.model.outgoing.length) {
        // Create new collection
        var devices = new Device.Collection();

        // Make sure models have a devtype and push them to devices
        devices.reset(this.model.outgoing.filter(function(device){
          var devtype = device.get('devtype');

          return devtype && devtype !== 'Draker Panel Monitor' && devtype !== 'AC Bus';
        }));

        // Create a new collection view with this device's chidren
        this.children = new Device.views.NavigationList({collection: devices});

        // Render the view so the element is available
        this.children.render();

        // Append the child element to this view
        this.$el.append(this.children.$el);
      }
    },
    onClose: function(){
      // Close children view
      this.children.close();
    },
    initialize: function(options){
      // Add the dev type for targeted styles
      this.$el.addClass(options.model.get('devtype').replace(' ', '_'));
      this.$el.attr('id', this.model.id);
    }
  });

  Device.views.NavigationList = Marionette.CollectionView.extend({
    tagName: 'ul',
    attributes: {
      class: 'devices'
    },
    itemView: Device.views.DeviceListItem
  });

  return Device;
});
