define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'library',
  'device',
  './editor_input',

  'hbs!project/templates/editor'
], function(
  $,
  _,
  Backbone,
  Marionette,

  library,
  Device,
  InputView,

  editorTemplate
){

  function mapSelectionTypes(selection, props){
    return selection.chain()

      // Convert selection to a list of uniq device types
      .invoke('get', 'device_type').uniq()

      // Map the selected device types to library models
      .reduce(function(memo, type){
        var model = library.findWhere({device_type: type});

        if (model) {
          memo.push(model);
        }

        return memo;
      }, [])

      // Map the library models to related device types
      .map(function(model){
        var rels = model.get('relationships');

        if (props) {
          rels = _.where(rels, props);
        }

        return _.pluck(rels, 'device_type');
      })

      // Reduce the related device types to a single common set
      .take(function(arr){
        return _.intersection.apply(this, arr);
      })

      .value();
  }

  function findRelationships(device, target){
    var type = device.get('device_type');

    return library.chain()

      // Find device type in library
      .find(function(model) {
        return model.get('device_type') === type;
      })

      // Extract the relatinship array
      .take(function(model) {
        return model.get('relationships');
      })

      // Filter the relationships by the target device type
      .where({device_type: target.get('device_type')})

      .value();
  }

  function findIncomingRelationshipLabel(device, target){
    var rels = findRelationships(device, target);

    return (_.findWhere(rels, {direction: 'INCOMING'}) || {}).label;
  }

  function findNextIndex(project, type, index){
    index = index || 1;

    project.devices.each(function(device){
      var num;

      if (device.get('device_type') === type) {
        num = parseInt(device.get('did').replace(/^.*-/, ''), 10);

        if (num && num >= index) {
          index = num + 1;
        }
      }
    });

    return index;
  }

  function findRendering(device_type, label){
    var model = library.findWhere({device_type: device_type});

    return _.findWhere(model.get('renderings'), {label: label});
  }

  function positionDevice(device, rendering, project, target){
    var position;

    if (rendering.root) {
      position = _.clone(rendering.position);

      if (position) {
        project.devices.each(function(other){
          var pos = other.getPosition(rendering.label);

          if (pos && pos.y >= position.y) {
            position.y = pos.y + 200;
          }
        });
      }

    } else if (target && target !== project) {
      position = target.getPosition(rendering.label);

      if (position && rendering.offset) {
        position.x += rendering.offset.x || 0;
        position.y += rendering.offset.y || 0;
      }
    }

    function overlaps(other){
      var pos = other.getPosition(rendering.label);

      return pos && pos.x === position.x && pos.y === position.y;
    }

    if (position) {
      while (project.devices.any(overlaps)) {
        position.y += 100;
      }

      device.setPosition(rendering.label, position);
    }
  }


  return Marionette.ItemView.extend({
    tagName: 'form',
    template: {
      type: 'handlebars',
      template: editorTemplate
    },

    attributes: {
      id: 'editor'
    },

    initialize: function(){
      this.viewCollection = new Backbone.Collection();
      this.addCollection = new Backbone.Collection();
      this.connectCollection = new Backbone.Collection();
      this.disconnectCollection = new Backbone.Collection();

      this.listenTo(Backbone, 'editor:selection', function(selection){
        this.selection = selection.length > 0 ? selection : null;
      });
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

    onShow: function(){
      this.buildInputViews();
      this.rendering_label = this.viewView.parseInput().toUpperCase();
      Backbone.trigger('editor:rendering', this.rendering_label);
    },

    buildInputViews: function(){
      _.each(this.inputViews, function(options, name){
        var collection = this[name + 'Collection'],
          view = this[name + 'View'] = _.extend( new InputView({
            el: this.$('#' + name),
            collection: collection
          }), options);

        if (collection) {
          collection.comparator = 'name';
        }

        _.each(['focus', 'apply'], function(evnt){
          this.listenTo(view, evnt, function(){
            this.triggerMethod(name + ':' + evnt);
          });
        }, this);
      }, this);
    },

    onViewFocus: function(){
      var
        renderings = library.reduce(function(memo, model){
          _.each(model.get('renderings'), function(rendering){
            var label = rendering.label;

            if (label && !_.findWhere(memo, {label: label})) {
              memo.push({
                name: label[0].toUpperCase() + label.slice(1).toLowerCase(),
                label: label
              });
            }
          });

          return memo;
        }, []);

      this.viewCollection.reset(renderings);
    },

    onAddFocus: function(){
      var types, models = [];

      if (this.selection) {
        types = mapSelectionTypes(this.selection, {direction: 'OUTGOING'});

        models = library.filter(function(model){
          return _.contains(types, model.get('device_type')) &&
            _.findWhere(model.get('renderings'), {label: this.rendering_label});
        }, this);
      } else {
        models = library.filter(function(model){
          return _.findWhere(model.get('renderings'), {
            label: this.rendering_label,
            root: true
          });
        }, this);
      }

      this.addCollection.reset(models);
    },

    onConnectFocus: function(){
      var devices = [];

      if (this.selection && this.selection.length > 0) {
        devices = this.model.devices.filter(function(device){

          // Don't show selected devices
          if (this.selection.contains(device)) {
            return false;
          }

          // Don't show devices that can't be rendered
          if (!findRendering(device.get('device_type'), this.rendering_label)) {
            return false;
          }

          // Only show devices that have a relationship and aren't already children
          return this.selection.all(function(select){
            var relationship = findIncomingRelationshipLabel(device, select);

            return relationship && !select.hasChild(device, relationship);
          });
        }, this);
      }

      this.connectCollection.reset(devices);
    },

    onDisconnectFocus: function(){
      var devices = [];

      if (this.selection && this.selection.length > 0) {
        devices = this.selection.chain()

          // Map the outgoing devices for this rendering
          .map(function(device){
            return device.outgoing.filter(function(other){
              return other.getRelationship(device, this.rendering_label);
            }, this);
          }, this)

          // Reduce the devices to a single common set
          .take(function(arr){
            return _.intersection.apply(this, arr);
          })

          // Prevent orphend nodes
          .filter(function(device){
            return device.incoming.length > this.selection.length;
          }, this)

          .value();
      }

      this.disconnectCollection.reset(devices);
    },

    onViewApply: function(){
      var name = this.viewView.parseInput(),
        rendering = this.viewCollection.findWhere({name: name}),
        label = rendering && rendering.get('label');

      if (label) {
        if (this.rendering_label !== label) {
          this.rendering_label = label;
          Backbone.trigger('editor:rendering', label);
        }

        this.viewView.placeholder = name;
        this.viewView.ui.input.blur();
      }
    },

    onAddApply: function(){
      var times = this.addView.times || 1,
        name = this.addView.parseInput(),
        model = this.addCollection.findWhere({name: name});

      if (model) {
        if (this.selection && this.selection.length > 0) {
          this.selection.each(function(target){
            _.times(times, function(){
              this.addDevice(model, target);
            }, this);
          }, this);
        } else {
          _.times(times, function(){
            this.addDevice(model, this.model);
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

    addDevice: function(model, target){
      var project = this.model,
        type = model.get('device_type'),
        index = findNextIndex(project, type),

        device = new Device.Model({
          project_label: project.get('label'),
          device_type: type,
          name: model.get('name') + ' ' + index,
          did: model.get('prefix') + '-' + index
        }),

        rendering = _.findWhere(model.get('renderings'), {label: this.rendering_label}),

        relationship_label = (target === project) ? 'COMPRISES' :
          findIncomingRelationshipLabel(device, target);

      if (rendering && relationship_label && target.has('id')) {
        positionDevice(device, rendering, project, target);

        project.devices.add(device);
        device.connectTo(target, relationship_label);

        device.save({
          parent_id: target.get('id'),
          relationship_label: relationship_label
        });
      }
    },

    connectDevice: function(device, target){
      var project = this.model,
        rendering = findRendering(device.get('device_type'), this.rendering_label),
        relationship_label = findIncomingRelationshipLabel(device, target);

      if (rendering && relationship_label) {
        $.ajax('/api/relationships', {
          type: 'POST',

          data: {
            relationship_label: relationship_label,
            project_label: project.get('label'),
            from_id: target.get('id'),
            to_id: device.get('id')
          },

          success: function(){
            if (!device.getPosition(rendering.label)) {
              positionDevice(device, rendering, project, target);
              device.save();
            }

            device.connectTo(target, relationship_label);
          }
        });
      }
    },

    disconnectDevice: function(device, target){
      var project = this.model,
        relationship_label = device.getRelationship(target),
        rendering_label = this.rendering_label;

      if (relationship_label) {
        $.ajax('/api/relationships', {
          type: 'DELETE',

          data: {
            relationship_label: relationship_label,
            project_label: project.get('label'),
            from_id: target.get('id'),
            to_id: device.get('id')
          },

          success: function(){
            device.disconnectFrom(target);

            var others = device.incoming.filter(function(other){
              return device.getRelationship(other, rendering_label);
            });

            if (others.length === 0) {
              device.setPosition(rendering_label, null, true);
            }
          }
        });
      }
    }
  });
});
