define(['backbone'], function(Backbone){

  return new Backbone.Collection([
    {
      device_type: 'INVERTER',
      name: 'Inverter',
      prefix: 'INV',
      relationships: [
        {relationship_label: 'FLOWS', direction: 'OUTGOING', device_type: 'AC_BUS'},
        {relationship_label: 'FLOWS', direction: 'OUTGOING', device_type: 'TRANSFORMER'},
        {relationship_label: 'FLOWS', direction: 'OUTGOING', device_type: 'INTERCONNECT'},

        {relationship_label: 'COLLECTS', direction: 'OUTGOING', device_type: 'DC_BUS'},
        {relationship_label: 'COLLECTS', direction: 'OUTGOING', device_type: 'PANEL'}
      ],
      root: true
    },
    {
      device_type: 'AC_BUS',
      name: 'AC Bus',
      prefix: 'ACB',
      relationships: [
        {relationship_label: 'MEASURED_BY', direction: 'OUTGOING', device_type: 'METER'},

        {relationship_label: 'FLOWS', direction: 'INCOMING', device_type: 'INVERTER'},
        {relationship_label: 'FLOWS', direction: 'INCOMING', device_type: 'AC_BUS'},
        {relationship_label: 'FLOWS', direction: 'INCOMING', device_type: 'TRANSFORMER'},

        {relationship_label: 'FLOWS', direction: 'OUTGOING', device_type: 'AC_BUS'},
        {relationship_label: 'FLOWS', direction: 'OUTGOING', device_type: 'TRANSFORMER'},
        {relationship_label: 'FLOWS', direction: 'OUTGOING', device_type: 'INTERCONNECT'}
      ],
      positionOffset: {x: 100, y: 0}
    },
    {
      device_type: 'METER',
      name: 'Meter',
      prefix: 'RM',
      relationships: [
        {relationship_label: 'MEASURED_BY', direction: 'INCOMING', device_type: 'AC_BUS'}
      ],
      positionOffset: {x: 100, y: -100}
    },
    {
      device_type: 'TRANSFORMER',
      name: 'Transformer',
      prefix: 'XFR',
      relationships: [
        {relationship_label: 'FLOWS', direction: 'INCOMING', device_type: 'INVERTER'},
        {relationship_label: 'FLOWS', direction: 'INCOMING', device_type: 'AC_BUS'},
        {relationship_label: 'FLOWS', direction: 'INCOMING', device_type: 'TRANSFORMER'},

        {relationship_label: 'FLOWS', direction: 'OUTGOING', device_type: 'AC_BUS'},
        {relationship_label: 'FLOWS', direction: 'OUTGOING', device_type: 'TRANSFORMER'},
        {relationship_label: 'FLOWS', direction: 'OUTGOING', device_type: 'INTERCONNECT'}
      ],
      positionOffset: {x: 100, y: 0}
    },
    {
      device_type: 'INTERCONNECT',
      name: 'Interconnect',
      prefix: 'IC',
      relationships: [
        {relationship_label: 'FLOWS', direction: 'INCOMING', device_type: 'INVERTER'},
        {relationship_label: 'FLOWS', direction: 'INCOMING', device_type: 'AC_BUS'},
        {relationship_label: 'FLOWS', direction: 'INCOMING', device_type: 'TRANSFORMER'}
      ],
      positionOffset: {x: 100, y: 0}
    },
    {
      device_type: 'DC_BUS',
      name: 'DC Bus',
      prefix: 'DCB',
      relationships: [
        {relationship_label: 'COLLECTS', direction: 'INCOMING', device_type: 'INVERTER'},
        {relationship_label: 'COLLECTS', direction: 'INCOMING', device_type: 'DC_BUS'},

        {relationship_label: 'COLLECTS', direction: 'OUTGOING', device_type: 'DC_BUS'},
        {relationship_label: 'COLLECTS', direction: 'OUTGOING', device_type: 'PANEL'}
      ],
      positionOffset: {x: -100, y: 0}
    },
    {
      device_type: "PANEL",
      name: "PV Panels",
      prefix: "PV",
      relationships: [
        {relationship_label: 'COLLECTS', direction: 'INCOMING', device_type: 'INVERTER'},
        {relationship_label: 'COLLECTS', direction: 'INCOMING', device_type: 'DC_BUS'}
      ],
      positionOffset: {x: -100, y: 0}
    }
  ]);
});
