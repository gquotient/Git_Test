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

  function findModel(device){
    return library.findWhere({label: device.getType()});
  }

  function findRelatedModels(devices, props){
    return devices.chain()

      // Convert selection to a list of uniq library models
      .map(findModel).compact().uniq()

      // Map the models to related targets
      .map(function(model){
        var rels = model.get('relationships');

        if (props) {
          rels = rels.filter(function(rel){
            return _.all(props, function(value, key){
              if (key === 'rendering') {
                return Device.Model.prototype.checkRelationship(rel.label, value);
              }

              return rel[key] === value;
            });
          });
        }

        return _.pluck(rels, 'target');
      })

      // Reduce the targets to a single common set
      .take(function(arr){
        return _.intersection.apply(this, arr);
      })

      // Map the targets to a list of uniq library models
      .map(function(target){
        return library.findWhere({label: target});
      }).compact().uniq()

      .value();
  }

  function findRelationshipLabel(device, target, rendering){
    var model = findModel(device),
      rel = _.findWhere(model && model.get('relationships'), {
        target: target.getType(),
        direction: 'INCOMING'
      }),
      label = rel && rel.label;

    if (label && (!rendering || device.checkRelationship(label, rendering))) {
      return label;
    }
  }

  function findRendering(device, label){
    var model = findModel(device);

    if (model) {
      return _.findWhere(model.get('renderings'), {label: label});
    }
  }

  function findNextIndex(type, others){
    var index = 1;

    others.each(function(other){
      var did = other.get('did'),
        parts = did && did.split('-'),
        num = parts && parseInt(parts[1], 10);

      if (num && num >= index && parts[0] === type) {
        index = num + 1;
      }
    });

    return index;
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

    } else if (target && target.getPosition) {
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
      var renderings = [];

      library.each(function(model){
        _.each(model.get('renderings'), function(rendering){
          var label = rendering.label;

          if (label && !_.findWhere(renderings, {label: label})) {
            renderings.push({
              name: label[0].toUpperCase() + label.slice(1).toLowerCase(),
              label: label
            });
          }
        });
      });

      this.viewCollection.reset(renderings);
    },

    onAddFocus: function(){
      var models = [];

      if (this.selection) {
        models = findRelatedModels(this.selection, {
          direction: 'OUTGOING',
          rendering: this.rendering_label
        });
      } else {
        models = library.models;
      }

      models = _.chain(models)

        .filter(function(model){
          var rendering;

          rendering = _.findWhere(model.get('renderings'), {
            label: this.rendering_label
          });

          // Don't show devices that can't be rendered in current view
          if (!rendering) {
            return false;
          }

          return this.selection || rendering.root;
        }, this)

        .sortBy(function(device){
          return device.get('name');
        })

        .value();

      this.addCollection.reset(models);
    },

    onConnectFocus: function(){
      var devices = [];

      if (this.selection && this.selection.length > 0) {
        devices = this.model.devices.chain()

          .filter(function(device){

            // Don't show selected devices
            if (this.selection.contains(device)) {
              return false;
            }

            // Don't show devices that can't be rendered
            if (!findRendering(device, this.rendering_label)) {
              return false;
            }

            // Only show devices that have a relationship and aren't already children
            return this.selection.all(function(select){
              var rel = findRelationshipLabel(device, select, this.rendering_label);

              return rel && !select.hasChild(device, rel);
            });
          }, this)

          .sortBy(function(device){
            return device.get('name');
          })

          .value();
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

          .sortBy(function(device){
            return device.get('name');
          })

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
          this.selection = null;
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
            this.addDevice(model);
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
      var parnt, rel,

        project = this.model,
        type = model.get('label'),
        index = findNextIndex(type, project.devices),

        device = new Device.Model({
          project_label: project.get('label'),
          did: type + '-' + index,
          name: model.get('name') + ' ' + index
        });

      _.each(model.get('renderings'), function(rendering){
        if (rendering.root) {
          positionDevice(device, rendering, project);
          parnt = project;

        } else if (rendering.label === this.rendering_label) {
          positionDevice(device, rendering, project, target);
        }
      }, this);

      if (!parnt && target) {
        parnt = target;
        target = null;
      }

      if (parnt) {
        rel = findRelationshipLabel(device, parnt);
      }

      if (rel && parnt.has('id')) {
        project.devices.add(device);
        device.connectTo(parnt, rel);

        device.save({
          parent_id: parnt.get('id'),
          relationship_label: rel
        },
        {
          success: _.bind(function(){
            if (target) {
              this.connectDevice(device, target);
            }
          }, this)
        });
      }
    },

    connectDevice: function(device, target){
      var project = this.model,
        rendering = findRendering(device, this.rendering_label),
        rel = findRelationshipLabel(device, target, this.rendering_label);

      if (rendering && rel) {
        $.ajax('/api/relationships', {
          type: 'POST',

          data: {
            relationship_label: rel,
            project_label: project.get('label'),
            from_id: target.get('id'),
            to_id: device.get('id')
          },

          success: function(){
            if (!device.getPosition(rendering.label)) {
              positionDevice(device, rendering, project, target);
              device.save();
            }

            device.connectTo(target, rel);
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
