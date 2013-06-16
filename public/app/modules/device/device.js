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
  var Device = { views: {} },

    // Need a better place for this.
    renderingRelationships = {
      ELECTRICAL: ['FLOWS', 'COLLECTS', 'MEASURED_BY'],
      COMMUNICATION: ['MANAGES', 'HAS']
    };

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

    getRelationship: function(target, label){
      var relationship = this.relationships[target.id];

      if (!label || _.contains(renderingRelationships[label], relationship)) {
        return relationship;
      }
    },

    getPosition: function(label){
      var renderings = this.get('renderings');

      return _.clone(renderings[label]);
    },

    setPosition: function(label, position, save){
      var renderings = _.clone(this.get('renderings')), evnt;

      if (position) {
        if (!_.has(renderings, label)) {
          evnt = 'add';
        } else if (_.isEqual(renderings[label], position)) {
          return;
        }
        renderings[label] = position;
      } else {
        evnt = 'remove';
        delete renderings[label];
      }

      this[save ? 'save' : 'set']({renderings: renderings});

      if (evnt) {
        this.trigger('rendering:' + evnt, this);
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
    onRender: function(){
      if (this.model.outgoing.length) {
        var subListView = new Device.views.NavigationList({collection: this.model.outgoing});

        subListView.render();
        this.$el.append(subListView.$el);
      }
    },
    initialize: function(options) {

    }
  });

  Device.views.NavigationList = Marionette.CollectionView.extend({
    tagName: 'ul',
    attributes: {
      class: 'devices'
    },
    itemView: Device.views.DeviceListItem,
    initialize: function(options) {

    }
  });

  return Device;
});
