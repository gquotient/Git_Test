define(['backbone'], function(Backbone){

  return new Backbone.Collection([
    {
      device_type: 'DAQ',
      name: 'DAQ',
      prefix: 'DAQ',
      relationships: [
        {label: 'MANAGES', direction: 'OUTGOING', device_type: 'INVERTER'},
        {label: 'MANAGES', direction: 'OUTGOING', device_type: 'METER'},
        {label: 'MANAGES', direction: 'OUTGOING', device_type: 'RECOMBINER'},
        {label: 'MANAGES', direction: 'OUTGOING', device_type: 'COMBINER'}
      ],
      renderings: [
        {label: 'COMMUNICATION', position: {x: 200, y: 200}, root: true}
      ]
    },
    {
      device_type: 'INVERTER',
      name: 'Inverter',
      prefix: 'INV',
      relationships: [
        {label: 'FLOWS', direction: 'OUTGOING', device_type: 'AC_BUS'},
        {label: 'FLOWS', direction: 'OUTGOING', device_type: 'TRANSFORMER'},
        {label: 'FLOWS', direction: 'OUTGOING', device_type: 'INTERCONNECT'},

        {label: 'COLLECTS', direction: 'OUTGOING', device_type: 'DC_BUS'},

        {label: 'MEASURED_BY', direction: 'OUTGOING', device_type: 'METER'},

        {label: 'MANAGES', direction: 'INCOMING', device_type: 'DAQ'}
      ],
      renderings: [
        {label: 'ELECTRICAL', position: {x: 700, y: 200}, root: true},
        {label: 'COMMUNICATION', offset: {x: 100, y: 0}}
      ]
    },
    {
      device_type: 'LOAD',
      name: 'Load',
      prefix: 'LD',
      relationships: [
        {label: 'FLOWS', direction: 'OUTGOING', device_type: 'AC_BUS'},
        {label: 'FLOWS', direction: 'OUTGOING', device_type: 'TRANSFORMER'},
        {label: 'FLOWS', direction: 'OUTGOING', device_type: 'INTERCONNECT'}
      ],
      renderings: [
        {label: 'ELECTRICAL', position: {x: 700, y: 200}, root: true}
      ]
    },
    {
      device_type: 'AC_BUS',
      name: 'AC Bus',
      prefix: 'ACB',
      relationships: [
        {label: 'FLOWS', direction: 'INCOMING', device_type: 'INVERTER'},
        {label: 'FLOWS', direction: 'INCOMING', device_type: 'LOAD'},
        {label: 'FLOWS', direction: 'INCOMING', device_type: 'AC_BUS'},
        {label: 'FLOWS', direction: 'INCOMING', device_type: 'TRANSFORMER'},

        {label: 'FLOWS', direction: 'OUTGOING', device_type: 'AC_BUS'},
        {label: 'FLOWS', direction: 'OUTGOING', device_type: 'TRANSFORMER'},
        {label: 'FLOWS', direction: 'OUTGOING', device_type: 'INTERCONNECT'},

        {label: 'MEASURED_BY', direction: 'OUTGOING', device_type: 'METER'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: 100, y: 0}}
      ]
    },
    {
      device_type: 'METER',
      name: 'Meter',
      prefix: 'RM',
      relationships: [
        {label: 'MEASURED_BY', direction: 'INCOMING', device_type: 'INVERTER'},
        {label: 'MEASURED_BY', direction: 'INCOMING', device_type: 'AC_BUS'},

        {label: 'MANAGES', direction: 'INCOMING', device_type: 'DAQ'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: 100, y: -100}},
        {label: 'COMMUNICATION', offset: {x: 100, y: 0}}
      ]
    },
    {
      device_type: 'TRANSFORMER',
      name: 'Transformer',
      prefix: 'XFR',
      relationships: [
        {label: 'FLOWS', direction: 'INCOMING', device_type: 'INVERTER'},
        {label: 'FLOWS', direction: 'INCOMING', device_type: 'LOAD'},
        {label: 'FLOWS', direction: 'INCOMING', device_type: 'AC_BUS'},
        {label: 'FLOWS', direction: 'INCOMING', device_type: 'TRANSFORMER'},

        {label: 'FLOWS', direction: 'OUTGOING', device_type: 'AC_BUS'},
        {label: 'FLOWS', direction: 'OUTGOING', device_type: 'TRANSFORMER'},
        {label: 'FLOWS', direction: 'OUTGOING', device_type: 'INTERCONNECT'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: 100, y: 0}}
      ]
    },
    {
      device_type: 'INTERCONNECT',
      name: 'Interconnect',
      prefix: 'IC',
      relationships: [
        {label: 'FLOWS', direction: 'INCOMING', device_type: 'INVERTER'},
        {label: 'FLOWS', direction: 'INCOMING', device_type: 'LOAD'},
        {label: 'FLOWS', direction: 'INCOMING', device_type: 'AC_BUS'},
        {label: 'FLOWS', direction: 'INCOMING', device_type: 'TRANSFORMER'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: 100, y: 0}}
      ]
    },
    {
      device_type: 'DC_BUS',
      name: 'DC Bus',
      prefix: 'DCB',
      relationships: [
        {label: 'COLLECTS', direction: 'INCOMING', device_type: 'INVERTER'},

        {label: 'COLLECTS', direction: 'OUTGOING', device_type: 'ARRAY'},
        {label: 'COLLECTS', direction: 'OUTGOING', device_type: 'RECOMBINER'},
        {label: 'COLLECTS', direction: 'OUTGOING', device_type: 'COMBINER'},
        {label: 'COLLECTS', direction: 'OUTGOING', device_type: 'STRING'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: -100, y: 0}}
      ]
    },
    {
      device_type: 'ARRAY',
      name: 'Array',
      prefix: 'APH',
      relationships: [
        {label: 'COLLECTS', direction: 'INCOMING', device_type: 'DC_BUS'},
        {label: 'COLLECTS', direction: 'INCOMING', device_type: 'RECOMBINER'},
        {label: 'COLLECTS', direction: 'INCOMING', device_type: 'COMBINER'},
        {label: 'COLLECTS', direction: 'INCOMING', device_type: 'STRING'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: -100, y: 0}}
      ]
    },
    {
      device_type: 'RECOMBINER',
      name: 'Recombiner',
      prefix: 'RCB',
      relationships: [
        {label: 'COLLECTS', direction: 'INCOMING', device_type: 'DC_BUS'},

        {label: 'COLLECTS', direction: 'OUTGOING', device_type: 'ARRAY'},
        {label: 'COLLECTS', direction: 'OUTGOING', device_type: 'COMBINER'},

        {label: 'MANAGES', direction: 'INCOMING', device_type: 'DAQ'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: -100, y: 0}},
        {label: 'COMMUNICATION', offset: {x: 100, y: 0}}
      ]
    },
    {
      device_type: 'COMBINER',
      name: 'Combiner',
      prefix: 'CMB',
      relationships: [
        {label: 'COLLECTS', direction: 'INCOMING', device_type: 'DC_BUS'},
        {label: 'COLLECTS', direction: 'INCOMING', device_type: 'RECOMBINER'},

        {label: 'COLLECTS', direction: 'OUTGOING', device_type: 'ARRAY'},
        {label: 'COLLECTS', direction: 'OUTGOING', device_type: 'STRING'},

        {label: 'MANAGES', direction: 'INCOMING', device_type: 'DAQ'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: -100, y: 0}},
        {label: 'COMMUNICATION', offset: {x: 100, y: 0}}
      ]
    },
    {
      device_type: 'STRING',
      name: 'String',
      prefix: 'S',
      relationships: [
        {label: 'COLLECTS', direction: 'INCOMING', device_type: 'DC_BUS'},
        {label: 'COLLECTS', direction: 'INCOMING', device_type: 'COMBINER'},

        {label: 'COLLECTS', direction: 'OUTGOING', device_type: 'ARRAY'},
        {label: 'COLLECTS', direction: 'OUTGOING', device_type: 'PANEL'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: -100, y: 0}}
      ]
    },
    {
      device_type: 'PANEL',
      name: 'Panel',
      prefix: 'P',
      relationships: [
        {label: 'COLLECTS', direction: 'INCOMING', device_type: 'STRING'},
        {label: 'COLLECTS', direction: 'INCOMING', device_type: 'PANEL'},

        {label: 'COLLECTS', direction: 'OUTGOING', device_type: 'PANEL'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: -100, y: 0}}
      ]
    }
  ]);
});
