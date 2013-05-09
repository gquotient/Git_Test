var _ = require("lodash");

/*
Devices:

[
  {
    id: 100,
    name: "INV-1",
    type: "inverter",
    position: {x: 100, y: 200},
    feeds: [101]
  }
]
*/

function generateDeviceSet(num){
  var set = _.map([
    {name: 'PV-' + num, type: 'panel'},
    {name: 'DCB-' + num, type: 'dc_bus'},
    {name: 'INV-' + num, type: 'inverter'},
    {name: 'ACB-' + num, type: 'ac_bus'},
    {name: 'RM-' + num, type: 'meter'}
  ], function(device, index){
    return _.extend(device, {
      id: num * 100 + index,
      position: {x: (index + 1) * 100, y: num * 200}
    });
  });

  set[1].edges = [
    {device: set[0].id, type: 'collects'}
  ];

  set[2].edges = [
    {device: set[1].id, type: 'collects'},
    {device: set[3].id, type: 'feeds'}
  ];

  set[3].edges = [
    {device: set[4].id, type: 'measured_by'},
    {device: 1000, type: 'feeds'}
  ];

  set[4].position.y -= 100;

  return set;
}

function generateDevices(){
  var devices = [],
    numberOfSets = _.random(8) + 1,
    center = Math.round(numberOfSets / 2) * 200;

  _.times(numberOfSets, function(index){
    devices.push(generateDeviceSet(index + 1));
  });

  devices = _.flatten(devices);

  devices.push({
    id: 1000,
    name: 'ACB-' + (numberOfSets + 1),
    type: 'ac_bus',
    position: {x: 900, y: center},
    edges: [
      {device: 1001, type: 'feeds'}
    ]
  });

  devices.push({
    id: 1001,
    name: 'IC-1',
    type: 'interconnect',
    position: {x: 1000, y: center}
  });

  return devices;
}

module.exports = generateDevices;
