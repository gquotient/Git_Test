define([
  'jquery',
  'underscore',
  'device',
  'library'
], function(
  $,
  _,
  Device,
  library
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

  function findNextPosition(rendering, project, target){
    var position;

    if (target && target !== project && target.getPosition) {
      position = target.getPosition(rendering.label);

      if (position && rendering.offset) {
        position.x += rendering.offset.x || 0;
        position.y += rendering.offset.y || 0;
      }
    }

    if (!position) {
      position = _.clone(rendering.position);

      if (rendering.root) {
        project.devices.each(function(device){
          var pos = device.getPosition(rendering.label);

          if (pos && pos.y >= position.y) {
            position.y = pos.y + 200;
          }
        });
      }
    }

    function overlaps(device){
      var pos = device.getPosition(rendering.label);

      return pos.x === position.x && pos.y === position.y;
    }

    while (project.devices.any(overlaps)) {
      position.y += 100;
    }

    return position;
  }

  return {

    filterForView: function(){
      return library.chain()

        // Convert library to a list of uniq rendering labels
        .reduce(function(memo, model){
          var renderings = model.get('renderings');

          _.each(renderings, function(rendering){
            var label = rendering.label;

            if (label && !_.contains(memo, label)) {
              memo.push(label);
            }
          });

          return memo;
        }, [])

        // Add a name field to each with the label capitalized
        .map(function(label){
          return {
            name: label[0].toUpperCase() + label.slice(1).toLowerCase(),
            label: label
          };
        })

        .value();
    },

    filterForAdd: function(selection){
      var types;

      if (selection) {
        types = mapSelectionTypes(selection, {direction: 'OUTGOING'});

        return _.reduce(types, function(memo, type){
          var model = library.findWhere({device_type: type});

          if (model) {
            memo.push(model);
          }

          return memo;
        }, []);

      } else {
        return library.where({root: true});
      }
    },

    addDevice: function(model, target, project){
      var type = model.get('device_type'),
        index = findNextIndex(project, type),

        device = new Device.Model({
          project_label: project.get('label'),
          device_type: type,
          name: model.get('name') + ' ' + index,
          did: model.get('prefix') + '-' + index
        }),

        relationship_label = (target === project) ? 'COMPRISES' :
          findIncomingRelationshipLabel(device, target);

      if (relationship_label && target.has('id')) {

        _.each(model.get('renderings'), function(rendering){
          var position = findNextPosition(rendering, project, target);

          device.setPosition(rendering.label, position);
        });

        project.devices.add(device);
        device.connectTo(target, relationship_label);

        device.save({
          parent_id: target.get('id'),
          relationship_label: relationship_label
        });
      }
    },

    filterForConnect: function(selection, models){
      var types;

      if (selection && models) {
        types = mapSelectionTypes(selection);

        return models.chain()

          // Prevent connections to self
          .reject(function(model){
            return selection.contains(model);
          })

          // Prevent connections to children
          .reject(function(model){
            return selection.any(function(device){
              return device.hasChild(model);
            });
          })

          // Filter connections by type
          .filter(function(model){
            return _.contains(types, model.get('device_type'));
          })

          // Filter connections by direction
          .filter(function(model){
            return selection.all(function(device){
              return findIncomingRelationshipLabel(model, device);
            });
          })

          .value();
      } else {
        return [];
      }
    },

    connectDevice: function(device, target, project){
      var relationship_label = findIncomingRelationshipLabel(device, target);

      if (relationship_label) {
        $.ajax('/api/relationships', {
          type: 'POST',

          data: {
            relationship_label: relationship_label,
            project_label: project.get('label'),
            from_id: target.get('id'),
            to_id: device.get('id')
          },

          success: function(){
            device.connectTo(target, relationship_label);
          }
        });
      }
    },

    filterForDisconnect: function(selection){
      if (selection) {
        return selection.chain()

          // Map the outgoing devices
          .map(function(device){
            return device.outgoing.models;
          })

          // Reduce the devices to a single common set
          .take(function(arr){
            return _.intersection.apply(this, arr);
          })

          // Prevent orphend nodes
          .reject(function(device){
            return device.incoming.length <= selection.length;
          })

          .value();
      } else {
        return [];
      }
    },

    disconnectDevice: function(device, target, project){
      var relationship_label = device.getRelationship(target);

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
          }
        });
      }
    }
  };
});
