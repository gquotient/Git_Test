define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  './editor_input',

  'hbs!project/templates/editor'
], function(
  $,
  _,
  Backbone,
  Marionette,

  InputView,

  editorTemplate
){
  return Marionette.ItemView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: editorTemplate
    },

    attributes: {
      id: 'editor'
    },

    initialize: function(options){
      this.equipment = options.equipment;

      this.viewCollection = new Backbone.Collection();
      this.addCollection = new Backbone.Collection([], {comparator: 'name'});
      this.connectCollection = new Backbone.Collection([], {comparator: 'name'});
      this.disconnectCollection = new Backbone.Collection([], {comparator: 'name'});

      this.listenTo(Backbone, 'editor:selection', function(selection){
        this.selection = selection.length > 0 ? selection : null;
      });

      this.listenTo(Backbone, 'editor:keydown editor:keypress', this.handleKeyEvent);
    },

    keydownEvents: {
      46: 'delete'
    },

    handleKeyEvent: function(e){
      var value = (this[e.type + 'Events'] || {})[e.which];

      if (value && !_.contains(['INPUT', 'TEXTAREA'], e.target.nodeName)) {
        e.preventDefault();
        this.triggerMethod(value);
      }
    },

    modelEvents: {
      sync: function(project){
        this.checkRenderings(project.outgoing);
      }
    },

    checkRenderings: function(devices, target){
      var project = this.model;

      devices.each(function(device){
        var equip = device.equipment;

        equip.addRootRenderings(device, project);

        if (target) {
          _.each(this.equipment.getRenderingLabels(), function(label){
            if (!device.getPosition(label) && equip.getRelationship(target, label)) {
              equip.addRelativeRendering(device, project, label, target);
            }
          });
        }

        this.checkRenderings(device.outgoing, device);
        this.checkName(device);
      }, this);
    },

    checkName: function(device){
      var did, index;

      if (!device.has('name')) {
        did = device.get('did');
        index = did && parseInt(did.replace(/^.*-/, ''), 10);

        if (index) {
          device.set({name: device.equipment.get('name') + ' ' + index});
        }
      }
    },

    onShow: function(){
      this.buildInputViews();

      this.onViewFocus();
      this.onViewApply();
    },

    inputViews: {
      view: {
        hotKey: 118
      },
      add: {
        hotKey: 97,

        parseInput: function(){
          var input = InputView.prototype.parseInput.call(this),
            re = /^\d+\s*/,
            match = re.exec(input),
            times = match && parseInt(match[0], 10);

          this.times = times > 1 ? times : 1;

          return input.replace(re, '');
        },

        getAutocomplete: function(){
          var value = InputView.prototype.getAutocomplete.call(this);

          return value && this.times > 1 ? this.times + ' ' + value : value;
        }
      },
      connect: {
        hotKey: 99
      },
      disconnect: {
        hotKey: 100
      },
      import: {
        hotKey: 105
      }
    },

    buildInputViews: function(){
      _.each(this.inputViews, function(options, name){
        var collection = this[name + 'Collection'],
          view = this[name + 'View'] = _.extend( new InputView({
            el: this.$('#' + name),
            collection: collection
          }), options);

        _.each(['focus', 'apply'], function(evnt){
          this.listenTo(view, evnt, function(){
            this.triggerMethod(name + ':' + evnt);
          });
        }, this);
      }, this);
    },

    onViewFocus: function(){
      var views = [];

      _.each(this.equipment.getRenderingLabels(), function(label){
        views.push({
          name: label[0].toUpperCase() + label.slice(1).toLowerCase(),
          label: label
        });
      });

      views.push({name: 'Change Log', label: 'CHANGELOG'});

      this.viewCollection.reset(views);
    },

    onAddFocus: function(){
      var equipment = [];

      this.equipment.each(function(equip){

        // Don't include equipment that can't be rendered.
        if (!equip.hasRendering(this.currentView)) { return; }

        if (!this.selection) {

          // Don't include equipment that isn't root for the current view.
          if (!equip.isRoot(this.currentView)) { return; }

        } else {

          // Don't include equipment that doesn't have a relationship in the
          // current view or that can't be added to the selected devices.
          if (this.selection.any(function(select){
            var rel = equip.getRelationship(select.equipment, this.currentView);

            return !rel || !select.equipment.outgoing.contains(equip);
          }, this)) { return; }
        }

        equipment.push(equip);
      }, this);

      this.addCollection.reset(equipment);
    },

    onConnectFocus: function(){
      var devices = [];

      if (this.selection) {
        this.model.devices.each(function(device){
          var equip = device.equipment;

          // Don't include selected devices.
          if (this.selection.contains(device)) { return; }

          // Don't include devices that can't be rendered.
          if (!equip.hasRendering(this.currentView)) { return; }

          // Don't include devices that don't have a relationship in the
          // current view or are already children of the selected devices.
          if (this.selection.any(function(select){
            var rel = equip.getRelationship(select.equipment, this.currentView);

            return !rel || select.hasChild(device, rel);
          }, this)) { return; }

          devices.push(device);
        }, this);
      }

      this.connectCollection.reset(devices);
    },

    onDisconnectFocus: function(){
      var devices = [];

      if (this.selection) {
        this.model.devices.each(function(device){
          var equip = device.equipment;

          // Don't include selected devices.
          if (this.selection.contains(device)) { return; }

          // Don't include devices that don't have a relationship in the current
          // view or that don't share a connection with the selected devices.
          if (this.selection.any(function(select){
            var rel = equip.getRelationship(select.equipment, this.currentView);

            return !rel || !select.outgoing.contains(device);
          }, this)) { return; }

          // Don't include devices that could be orphend.
          if (device.incoming.length <= this.selection.length) { return; }

          devices.push(device);
        }, this);
      }

      this.disconnectCollection.reset(devices);
    },

    onViewApply: function(){
      var name = this.viewView.parseInput(),
        view = this.viewCollection.findWhere({name: name}),
        label = view && view.get('label');

      if (label) {
        if (this.currentView !== label) {
          this.currentView = label;
          this.selection = null;
          Backbone.trigger('editor:change:view', label);
        }

        this.viewView.placeholder = name;
        this.viewView.ui.input.blur();
      }
    },

    onAddApply: function(){
      var times = this.addView.times || 1,
        name = this.addView.parseInput(),
        equip = this.addCollection.findWhere({name: name});

      if (equip) {
        if (this.selection && this.selection.length > 0) {
          this.selection.each(function(target){
            _.times(times, function(){
              this.addDevice(equip, target);
            }, this);
          }, this);
        } else {
          _.times(times, function(){
            this.addDevice(equip);
          }, this);
        }

        this.addView.ui.input.blur();
      }
    },

    onConnectApply: function(){
      var name = this.connectView.parseInput(),
        device = this.connectCollection.findWhere({name: name});

      if (device) {
        if (this.selection) {
          this.selection.each(function(target){
            this.connectDevice(device, target);
          }, this);
        }

        this.connectView.ui.input.blur();
      }
    },

    onDisconnectApply: function(){
      var name = this.disconnectView.parseInput(),
        device = this.disconnectCollection.findWhere({name: name});

      if (device) {
        if (this.selection) {
          this.selection.each(function(target){
            this.disconnectDevice(device, target);
          }, this);
        }

        this.disconnectView.ui.input.blur();
      }
    },

    onDelete: function(){
      if (this.selection) {
        _.each(this.selection.models.slice(0), function(device){
          this.deleteDevice(device);
        }, this);
      }
    },

    addDevice: function(equip, target){
      var project = this.model,
        device = equip.factory(project),
        parnt, rel;

      if (equip.isRoot()) {
        equip.addRootRenderings(device, project);
        parnt = project;
      }

      if (target && equip.hasRendering(this.currentView)) {
        equip.addRelativeRendering(device, project, this.currentView, target);
        parnt = parnt || target;
      }

      if (parnt && parnt.has('id')) {
        rel = equip.getRelationship(parnt);

        if (rel) {
          project.devices.add(device);
          device.connectTo(parnt, rel);

          device.save({
            parent_id: parnt.get('id'),
            relationship_label: rel
          }).done(_.bind(function(){
            if (target && target !== parnt) {
              this.connectDevice(device, target);
            }
          }, this));
        }
      }
    },

    deleteDevice: function(device){
      var project = this.model,
        equip = device.equipment,
        targets;

      // If the device has no outgoing relationships then delete it.
      if (device.outgoing.length === 0) {
        device.destroy({
          data: {
            project_label: project.get('label'),
            id: device.get('id')
          },
          processData: true
        });

      // Otherwise, if the device has no outgoing relationships in the current
      // view.
      } else if (!device.outgoing.any(function(other){
        return equip.getRelationship(other, this.currentView);
      }, this)) {

        // Then find all of the incoming relationship for the current view.
        targets = device.incoming.filter(function(other){
          return equip.getRelationship(other, this.currentView);
        }, this);

        // And if the device has at least one incoming relationship in another
        // view then remove it from this view.
        if (targets.length < device.incoming.length) {
          _.each(targets, function(target){
            this.disconnectDevice(device, target);
          }, this);
        }
      }
    },

    connectDevice: function(device, target){
      var project = this.model,
        equip = device.equipment,
        rel = equip.getRelationship(target);

      if (rel && equip.hasRendering(this.currentView)) {
        $.ajax('/api/relationships', {
          type: 'POST',
          data: {
            relationship_label: rel,
            project_label: project.get('label'),
            from_id: target.get('id'),
            to_id: device.get('id')
          }
        }).done(_.bind(function(){
          if (!device.getPosition(this.currentView)) {
            equip.addRelativeRendering(device, project, this.currentView, target);
            device.save();
          }

          device.connectTo(target, rel);
        }, this));
      }
    },

    disconnectDevice: function(device, target){
      var project = this.model,
        equip = device.equipment,
        rel = equip.getRelationship(target);

      if (rel) {
        $.ajax('/api/relationships', {
          type: 'DELETE',

          data: {
            relationship_label: rel,
            project_label: project.get('label'),
            from_id: target.get('id'),
            to_id: device.get('id')
          }
        }).done(_.bind(function(){
          device.disconnectFrom(target);

          if (device.incoming.all(function(other){
            return !equip.getRelationship(other, this.currentView);
          }, this)) {
            device.setPosition(this.currentView, null, true);
          }
        }, this));
      }
    }
  });
});
