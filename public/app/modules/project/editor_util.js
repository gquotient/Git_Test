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
      .find(function(model) {
        return model.get('device_type') === type;
      })
      .take(function(model) {
        return model.get('relationships');
      })
      .where({device_type: target.get('device_type')})
      .value();
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

  function findLowestPosition(devices){
    devices = _.sortBy(devices, function(device){
      return device.get('positionY');
    });

    return _.last(devices);
  }

  function adjustPosition(device, project){
    var x = device.get('positionX'),
      y = device.get('positionY'),
      type = device.get('device_type'),
      model = library.findWhere({device_type: type}),
      isRoot = model && model.get('root'),
      offset = model && model.get('positionOffset'),
      lowest;

    if (isRoot) {
      lowest = findLowestPosition(project.devices.where({device_type: type}));

      if (lowest) {
        x = lowest.get('positionX');
        y = lowest.get('positionY') + 200;
      }
    } else if (offset) {
      x += offset.x;
      y += offset.y;
    }

    while (project.devices.findWhere({positionX: x, positionY: y})) {
      y += 100;
    }

    device.set({positionX: x, positionY: y});
  }

  return {
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

    filterForConnect: function(selection, targets){
      var types;

      if (selection && targets) {
        types = mapSelectionTypes(selection);

        return targets.chain()

          // Limit connections by device type
          .filter(function(target){
            return _.contains(types, target.get('device_type'));
          })

          // Prevent connections to self and children
          .reject(function(target){
            return selection.any(function(device){
              return device === target || device.hasChild(target);
            });
          })

          // Prevent connections that already exist
          .reject(function(target){
            return selection.all(function(device){
              return target.outgoing.contains(device);
            });
          })

          .value();
      } else {
        return [];
      }
    },

    filterForDisconnect: function(selection){
      if (selection) {
        return selection.chain()

          // Aggregate all incoming devices
          .reduce(function(memo, device){

            if (device.incoming.length > 1 && device.outgoing.length === 0) {
              memo.push(device.incoming.models);
            }

            return memo;
          }, [])

          // Reduce the devices to a single common set
          .take(function(arr){
            return _.intersection.apply(this, arr);
          })

          .value();
      } else {
        return [];
      }
    },

    createDevice: function(model, target, project){
      var relationship_label, rel,
        type = model.get('device_type'),
        index = findNextIndex(project, type),
        name = model.get('name') + ' ' + index,
        did = model.get('prefix') + '-' + index,

        device = new Device.Model({
          project_label: project.get('label'),

          device_type: type,
          name: name,
          did: did,

          positionX: target.get('positionX') || 700,
          positionY: target.get('positionY') || 200
        });

      adjustPosition(device, project);

      if (target === project) {
        relationship_label = 'COMPRISES';

      } else if (target.has('device_type')) {
        rel = _.findWhere(
          findRelationships(device, target),
          {direction: 'INCOMING'}
        );

        relationship_label = rel && rel.relationship_label;
      }

      if (relationship_label && target.has('id')) {
        device.save({
          parent_id: target.get('id'),
          relationship_label: relationship_label
        }, {
          success: function(){
            project.devices.add(device);
            device.connectTo(target, relationship_label);
          }
        });
      }
    },

    connectDevice: function(device, target){
      var rels = findRelationships(device, target),
        rel = _.findWhere(rels, {direction: 'INCOMING'}) || _.first(rels);

      switch (rel && rel.direction) {
      case 'INCOMING':
        device.connectTo(target, rel.relationship_label);
        break;
      case 'OUTGOING':
        target.connectTo(device, rel.relationship_label);
        break;
      }
    },

    disconnectDevice: function(device, target){
      if (target.hasChild(device)) {
        device.disconnectFrom(target);
      } else if (device.hasChild(target)) {
        target.disconnectFrom(device);
      }
    }
  };
});
