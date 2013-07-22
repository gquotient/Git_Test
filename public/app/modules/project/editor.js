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

  InputField,

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

    inputFields: {
      view: {
        hotKey: 118,
        collection: new Backbone.Collection([
          {
            name: 'Power Flow',
            view: 'Canvas',
            rendering: 'POWER'
          }, {
            name: 'Data Acquisition',
            view: 'Canvas',
            rendering: 'DAQ'
          }, {
            name: 'Device Table',
            view: 'Table'
          }, {
            name: 'Notes',
            view: 'Notes'
          }
        ]),

        onShow: function(){
          this.triggerMethod('key:enter', this.collection.first());
        },

        onApply: function(model){
          this.placeholder = model.get('name');
        }
      },

      add: {
        hotKey: 97,
        collection: new Backbone.Collection([], {comparator: 'name'}),

        parseInput: function(){
          var input = InputField.prototype.parseInput.call(this),
            re = /^\d+\s*/,
            match = re.exec(input),
            times = match && parseInt(match[0], 10);

          this.times = times < 1 ? 1 : times > 100 ? 100 : times;

          return input.replace(re, '');
        },

        getAutocomplete: function(){
          var value = InputField.prototype.getAutocomplete.call(this);

          return value && this.times > 1 ? this.times + ' ' + value : value;
        }
      },

      connect: {
        hotKey: 99,
        collection: new Backbone.Collection([], {comparator: 'name'})
      },

      disconnect: {
        hotKey: 100,
        collection: new Backbone.Collection([], {comparator: 'name'})
      },

      import: {
        hotKey: 105
      }
    },

    initialize: function(options){
      this.equipment = options.equipment;
      this.user = options.user;

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
      var name, did, index;

      if (!device.has('name')) {
        did = device.get('did');

        if (did) {
          name = device.equipment.get('name');
          index = parseInt(did.replace(/^.*-/, ''), 10);

          name = name && index ? name + ' ' + index : did;
        } else {
          name = 'undefined';
        }

        device.set({name: name});
      }
    },

    onShow: function(){
      _.each(this.inputFields, function(options, name){
        var view = _.extend( new InputField({
          collection: options.collection,
          el: this.$('#' + name)
        }), _.omit(options, 'collection'));

        _.each(['focus', 'apply'], function(evnt){
          this.listenTo(view, evnt, function(){
            var args = Array.prototype.slice.apply(arguments);

            args.unshift(name + ':' + evnt, view);
            Marionette.triggerMethod.apply(this, args);
          });
        }, this);

        Marionette.triggerMethod.call(view, 'show');
      }, this);
    },

    onAddFocus: function(view){
      var rendering = this.currentView.get('rendering'),
        equipment = [];

      this.equipment.each(function(equip){

        // Don't include equipment that can't be rendered.
        if (!equip.hasRendering(rendering)) { return; }

        if (!this.selection) {

          // Don't include equipment that isn't root for the current view.
          if (!equip.isRoot(rendering)) { return; }

        } else {

          // Don't include equipment that doesn't have a relationship in the
          // current rendering or that can't be added to the selected devices.
          if (this.selection.any(function(select){
            var rel = equip.getRelationship(select.equipment, rendering);

            return !rel || !select.equipment.outgoing.contains(equip);
          }, this)) { return; }
        }

        equipment.push(equip);
      }, this);

      view.collection.reset(equipment);
    },

    onConnectFocus: function(view){
      var rendering = this.currentView.get('rendering'),
        devices = [];

      if (this.selection) {
        this.model.devices.each(function(device){
          var equip = device.equipment;

          // Don't include selected devices.
          if (this.selection.contains(device)) { return; }

          // Don't include devices that can't be rendered.
          if (!equip.hasRendering(rendering)) { return; }

          // Don't include devices that don't have a relationship in the current
          // rendering or are already children of the selected devices.
          if (this.selection.any(function(select){
            var rel = equip.getRelationship(select.equipment, rendering);

            return !rel || select.hasChild(device, rel);
          }, this)) { return; }

          devices.push(device);
        }, this);
      }

      view.collection.reset(devices);
    },

    onDisconnectFocus: function(view){
      var rendering = this.currentView.get('rendering'),
        devices = [];

      if (this.selection) {
        this.model.devices.each(function(device){
          var equip = device.equipment;

          // Don't include selected devices.
          if (this.selection.contains(device)) { return; }

          // Don't include devices that don't have a relationship in the current
          // rendering or that don't share a connection with the selected devices.
          if (this.selection.any(function(select){
            var rel = equip.getRelationship(select.equipment, rendering);

            return !rel || !select.outgoing.contains(device);
          }, this)) { return; }

          // Don't include devices that could be orphend.
          if (device.incoming.length <= this.selection.length) { return; }

          devices.push(device);
        }, this);
      }

      view.collection.reset(devices);
    },

    onViewApply: function(view, model){
      if (this.currentView !== model) {
        this.currentView = model;
        this.selection = null;

        Backbone.trigger('editor:change:view', _.extend(model.toJSON(), {
          model: this.model,
          collection: this.model.devices,
          editable: this.options.editable
        }));
      }
    },

    onAddApply: function(view, model){
      var times = view.times || 1;

      if (this.selection && this.selection.length > 0) {
        this.selection.each(function(target){
          _.times(times, function(){
            this.addDevice(model, target);
          }, this);
        }, this);
      } else {
        _.times(times, function(){
          this.addDevice(model);
        }, this);
      }
    },

    onConnectApply: function(view, model){
      if (this.selection) {
        this.selection.each(function(target){
          this.connectDevice(model, target);
        }, this);
      }
    },

    onDisconnectApply: function(view, model){
      if (this.selection) {
        this.selection.each(function(target){
          this.disconnectDevice(model, target);
        }, this);
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
        rendering = this.currentView.get('rendering'),
        device = equip.factory(project),
        parnt, rel;

      if (equip.isRoot()) {
        equip.addRootRenderings(device, project);
        parnt = project;
      }

      if (target && equip.hasRendering(rendering)) {
        equip.addRelativeRendering(device, project, rendering, target);
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
            project.log([
              'added',
              equip.get('name').toLowerCase(),
              device.get('did'),
              'to'
            ].concat(parnt.equipment ? [
              parnt.equipment.get('name').toLowerCase(),
              parnt.get('did')
            ] : 'project').join(' '), this.user);

            if (target && target !== parnt) {
              this.connectDevice(device, target);
            }
          }, this));
        }
      }
    },

    deleteDevice: function(device){
      var project = this.model,
        rendering = this.currentView.get('rendering'),
        equip = device.equipment,
        targets;

      // If the device has no outgoing relationships then delete it.
      if (device.outgoing.length === 0) {
        device.destroy({
          data: {
            project_label: project.id,
            id: device.get('id')
          },
          processData: true
        }).done(_.bind(function(){
          project.log([
            'deleted',
            equip.get('name').toLowerCase(),
            device.get('did')
          ].join(' '), this.user);
        }, this));

      // Otherwise, if the device has no outgoing relationships in the current
      // view.
      } else if (!device.outgoing.any(function(other){
        return equip.getRelationship(other, rendering);
      }, this)) {

        // Then find all of the incoming relationship for the current view.
        targets = device.incoming.filter(function(other){
          return equip.getRelationship(other, rendering);
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
        rendering = this.currentView.get('rendering'),
        equip = device.equipment,
        rel = equip.getRelationship(target);

      if (rel && equip.hasRendering(rendering)) {
        $.ajax('/api/relationships', {
          type: 'POST',
          data: {
            relationship_label: rel,
            project_label: project.id,
            from_id: target.get('id'),
            to_id: device.get('id')
          }
        }).done(_.bind(function(){
          if (!device.getPosition(rendering)) {
            equip.addRelativeRendering(device, project, rendering, target);
            device.save();
          }

          device.connectTo(target, rel);

          project.log([
            'connected',
            equip.get('name').toLowerCase(),
            device.get('did'),
            'to',
            target.equipment.get('name').toLowerCase(),
            target.get('did')
          ].join(' '), this.user);
        }, this));
      }
    },

    disconnectDevice: function(device, target){
      var project = this.model,
        rendering = this.currentView.get('rendering'),
        equip = device.equipment,
        rel = equip.getRelationship(target);

      if (rel) {
        $.ajax('/api/relationships', {
          type: 'DELETE',

          data: {
            relationship_label: rel,
            project_label: project.id,
            from_id: target.get('id'),
            to_id: device.get('id')
          }
        }).done(_.bind(function(){
          device.disconnectFrom(target);

          if (device.incoming.all(function(other){
            return !equip.getRelationship(other, rendering);
          }, this)) {
            device.setPosition(rendering, null, true);
          }

          project.log([
            'disconnected',
            equip.get('name').toLowerCase(),
            device.get('did'),
            'from',
            target.equipment.get('name').toLowerCase(),
            target.get('did')
          ].join(' '), this.user);
        }, this));
      }
    }
  });
});
