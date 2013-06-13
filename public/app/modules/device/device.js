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

    setPosition: function(view, position){
      var renderings = _.clone(this.get('renderings'));

      renderings[view] = position;
      this.set({renderings: renderings});
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

    hasChild: function(child){
      return this.outgoing.contains(child) ||
        this.outgoing.any(function(model){
          return model.hasChild(child);
        });
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

  Device.views.DeviceListItemView = Marionette.ItemView.extend({
    tagName: 'li',
    template: {
      type: 'handlebars',
      template: deviceListItemViewTemplate
    },
    attributes: {
      class: 'device'
    }
  });

  Device.views.NavigationListView = Marionette.CompositeView.extend({
    template: {
      type: 'handlebars',
      template: deviceListViewTemplate
    },
    attributes: {
      class: 'devices nav-item'
    },
    itemViewContainer: 'ul',
    itemView: Device.views.DeviceListItemView,
    initialize: function(options) {
    }
  });

  return Device;
});
