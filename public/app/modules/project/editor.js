define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'device',
  'equipment',

  './inputField',

  'hbs!project/templates/notes',
  'hbs!project/templates/editor',
  'hbs!project/templates/editorLock'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Device,
  Equipment,

  InputField,

  notesTemplate,
  editorTemplate,
  editorLockTemplate
){
  var views = {};

  views.Notes = Marionette.ItemView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: notesTemplate
    },

    attributes: {
      id: 'notes'
    },

    ui: {
      textarea: 'textarea'
    },

    initialize: function(){
      this.editable = false;
    },

    events: {
      'keyup textarea': function(e){
        this.model.set('notes', this.ui.textarea.val());

        if (e.which === 27) {
          this.ui.textarea.blur();
        }
      },

      'blur textarea': function(){
        if (this.editable) {
          this.model.save();
        }
      }
    },

    modelEvents: {
      'change:notes': function(){
        this.ui.textarea.val(this.model.get('notes'));
      }
    },

    onShow: function(){
      this.ui.textarea.attr('disabled', !this.editable);
    },

    onClose: function(){
      if (this.editable) {
        this.model.save();
      }
    }
  });

  views.Editor = Marionette.ItemView.extend({
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
      this.user = options.user;

      // Fetch project from server.
      this.model.fetch({
        data: {
          index_name: 'AlignedProjects/no'
        },
        equipment: this.equipment
      });

      this.listenTo(Backbone, 'editor:change:editable', function(editable){
        this.$el.find('input:not(.nav)').attr('disabled', !editable);
      });

      this.listenTo(Backbone, 'canvas:selection', function(selection){
        this.selection = selection.length > 0 ? selection : null;
      });

      _.bindAll(this, 'handleKeyEvent');
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

    inputFields: {
      view: {
        hotKey: 118,
        collection: new Backbone.Collection([
          {
            name: 'Power Flow',
            uri: 'power',
            View: Device.views.Canvas,
            rendering: 'POWER'
          }, {
            name: 'Data Acquisition',
            uri: 'daq',
            View: Device.views.Canvas,
            rendering: 'DAQ'
          }, {
            name: 'Device Table',
            uri: 'table',
            View: Device.views.Table
          }, {
            name: 'Notes',
            uri: 'notes',
            View: views.Notes
          }
        ]),

        extend: {
          onShow: function(){
            var model = this.collection.findWhere({uri: this.options.view});

            this.triggerMethod('key:enter', model || this.collection.first());
          },

          onApply: function(model){
            this.placeholder = model.get('name');
          }
        }
      },

      add: {
        hotKey: 97,
        comparator: 'name',

        extend: {
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
        }
      },

      connect: {
        hotKey: 99,
        comparator: 'name',
        applyAll: true
      },

      disconnect: {
        hotKey: 100,
        comparator: 'name',
        applyAll: true
      }
    },

    _initInputFields: function(){
      _.each(this.inputFields, function(obj, name){
        var view = new InputField(_.extend({}, _.omit(obj, 'extend'), {
          view: this.options.view,
          el: this.$('#' + name)
        }));

        _.extend(view, obj.extend);

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

    _initLockView: function(){
      this.lockView = new views.EditorLock({
        el: this.$('.lock'),
        model: this.model,
        user: this.user
      });
    },

    onShow: function(){
      this._initLockView();
      this._initInputFields();

      $(document).on('keydown keypress', this.handleKeyEvent);
    },

    onClose: function(){
      $(document).off('keydown keypress', this.handleKeyEvent);
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
          editable: this.lockView.editable
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
        device = equip.factory(project),
        parnt = equip.isRoot() ? project : target,
        rel = parnt && equip.getRelationship(parnt);

      if (rel && parnt.has('id')) {
        _.each(_.keys(Equipment.renderings), function(label){
          equip.addRendering(device, project, label, target);
        });

        project.devices.add(device);
        device.connectTo(parnt, rel);

        device.save({
          parent_id: parnt.get('id'),
          relationship_label: rel
        }, {
          success: _.bind(function(){
            project.addNote([
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
          }, this)
        });
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
          processData: true,
          success: _.bind(function(){
            project.addNote([
              'deleted',
              equip.get('name').toLowerCase(),
              device.get('did')
            ].join(' '), this.user);
          }, this)
        });

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
            equip.addRendering(device, project, rendering, target);
            device.save();
          }

          device.connectTo(target, rel);

          project.addNote([
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

          project.addNote([
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

  views.EditorLock = Marionette.ItemView.extend({
    template: {
      type: 'handlebars',
      template: editorLockTemplate
    },

    templateHelpers: function(){
      return {
        editable: this.editable,
        editor: this.editor
      };
    },

    initialize: function(){
      this.updateEditable();
    },

    triggers: {
      'click button.edit': 'edit',
      'click button.release': 'release'
    },

    modelEvents: {
      'change:locked': 'updateEditable',
      'change:editor': 'updateEditable',
      'change': 'updateTimer'
    },

    updateEditable: function(){
      var editable = this.model.get('locked') || false,
        editor = this.model.get('editor'),
        user = this.options.user.get('email');

      this.editor = !_.contains(['', 'unlocked', user], editor) && editor;

      if (this.editor) {
        editable = false;
      }

      if (this.editable !== editable) {
        this.editable = editable;

        Backbone.trigger('editor:change:editable', editable);
      }

      this.render();
      this.updateTimer();
    },

    updateTimer: function(){
      if (this.timer) { clearTimeout(this.timer); }

      if (!this.editable) { return; }

      this.timer = setTimeout(_.bind(function(){
        this.model.setLock(false);
      }, this), 5 * 60 * 1000);
    },

    onEdit: function(){
      this.model.setLock(true);
    },

    onRelease: function(){
      this.model.setLock(false);
    },

    onClose: function(){
      if (this.editable) {
        this.model.setLock(false);
      }

      if (this.timer) {
        clearTimeout(this.timer);
      }
    }
  });

  return views;
});
