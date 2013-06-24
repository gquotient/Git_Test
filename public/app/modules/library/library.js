define(['backbone'], function(Backbone){

  return new Backbone.Collection([
    {
      label: 'DSS',
      name: 'Base Station',
      relationships: [
        {label: 'HAS', direction: 'INCOMING', target: 'PVA'},
        {label: 'HAS', direction: 'INCOMING', target: 'PVS'},
        {label: 'HAS', direction: 'INCOMING', target: 'PVC'},

        {label: 'HAS', direction: 'OUTGOING', target: 'DSC'}
      ],
      renderings: [
        {label: 'COMMUNICATION', position: {x: 100, y: 100}, root: true}
      ]
    },
    {
      label: 'DSC',
      name: 'Computer',
      relationships: [
        {label: 'HAS', direction: 'INCOMING', target: 'DSS'},

        {label: 'MANAGES', direction: 'OUTGOING', target: 'ESI'},
        {label: 'MANAGES', direction: 'OUTGOING', target: 'INV'},
        {label: 'MANAGES', direction: 'OUTGOING', target: 'RM'},
        {label: 'MANAGES', direction: 'OUTGOING', target: 'RCB'},
        {label: 'MANAGES', direction: 'OUTGOING', target: 'CMB'}
      ],
      renderings: [
        {label: 'COMMUNICATION', offset: {x: 100, y: 0}}
      ]
    },
    {
      label: 'ESI',
      name: 'Env Suite',
      relationships: [
        {label: 'HAS', direction: 'INCOMING', target: 'DSS'},

        {label: 'HAS', direction: 'OUTGOING', target: 'IRRA'},
        {label: 'HAS', direction: 'OUTGOING', target: 'IRRZ'},
        {label: 'HAS', direction: 'OUTGOING', target: 'TMPC'},
        {label: 'HAS', direction: 'OUTGOING', target: 'TMPA'},
        {label: 'HAS', direction: 'OUTGOING', target: 'WSPD'},
        {label: 'HAS', direction: 'OUTGOING', target: 'WDIR'},
        {label: 'HAS', direction: 'OUTGOING', target: 'BARO'},
        {label: 'HAS', direction: 'OUTGOING', target: 'RAIN'},

        {label: 'MANAGES', direction: 'INCOMING', target: 'DSC'}
      ],
      renderings: [
        {label: 'COMMUNICATION', offset: {x: 200, y: 100}}
      ]
    },
    {
      label: 'IRRA',
      name: 'Pyranometer',
      relationships: [
        {label: 'HAS', direction: 'INCOMING', target: 'ESI'}
      ],
      renderings: [
        {label: 'COMMUNICATION', offset: {x: 100, y: 100}}
      ]
    },
    {
      label: 'IRRZ',
      name: 'Pyranometer',
      relationships: [
        {label: 'HAS', direction: 'INCOMING', target: 'ESI'}
      ],
      renderings: [
        {label: 'COMMUNICATION', offset: {x: 100, y: 100}}
      ]
    },
    {
      label: 'TMPC',
      name: 'Cell Temp',
      relationships: [
        {label: 'HAS', direction: 'INCOMING', target: 'ESI'}
      ],
      renderings: [
        {label: 'COMMUNICATION', offset: {x: 100, y: 100}}
      ]
    },
    {
      label: 'TMPA',
      name: 'Ambient Temp',
      relationships: [
        {label: 'HAS', direction: 'INCOMING', target: 'ESI'}
      ],
      renderings: [
        {label: 'COMMUNICATION', offset: {x: 100, y: 100}}
      ]
    },
    {
      label: 'WSPD',
      name: 'Anemometor',
      relationships: [
        {label: 'HAS', direction: 'INCOMING', target: 'ESI'}
      ],
      renderings: [
        {label: 'COMMUNICATION', offset: {x: 100, y: 100}}
      ]
    },
    {
      label: 'WDIR',
      name: 'Wind Vane',
      relationships: [
        {label: 'HAS', direction: 'INCOMING', target: 'ESI'}
      ],
      renderings: [
        {label: 'COMMUNICATION', offset: {x: 100, y: 100}}
      ]
    },
    {
      label: 'BARO',
      name: 'Barometer',
      relationships: [
        {label: 'HAS', direction: 'INCOMING', target: 'ESI'}
      ],
      renderings: [
        {label: 'COMMUNICATION', offset: {x: 100, y: 100}}
      ]
    },
    {
      label: 'RAIN',
      name: 'Rain Sensor',
      relationships: [
        {label: 'HAS', direction: 'INCOMING', target: 'ESI'}
      ],
      renderings: [
        {label: 'COMMUNICATION', offset: {x: 100, y: 100}}
      ]
    },
    {
      label: 'INV',
      name: 'Inverter',
      relationships: [
        {label: 'COMPRISES', direction: 'INCOMING', target: 'PVA'},
        {label: 'COMPRISES', direction: 'INCOMING', target: 'PVS'},
        {label: 'COMPRISES', direction: 'INCOMING', target: 'PVC'},

        {label: 'MANAGES', direction: 'INCOMING', target: 'DSC'},

        {label: 'MEASURED_BY', direction: 'OUTGOING', target: 'RM'},

        {label: 'FLOWS', direction: 'OUTGOING', target: 'ACB'},
        {label: 'FLOWS', direction: 'OUTGOING', target: 'XFR'},
        {label: 'FLOWS', direction: 'OUTGOING', target: 'IC'},

        {label: 'COLLECTS', direction: 'OUTGOING', target: 'DCB'}
      ],
      renderings: [
        {label: 'COMMUNICATION', offset: {x: 500, y: 100}},
        {label: 'ELECTRICAL', position: {x: 700, y: 200}, root: true}
      ]
    },
    {
      label: 'RM',
      name: 'Meter',
      relationships: [
        {label: 'MANAGES', direction: 'INCOMING', target: 'DSC'},

        {label: 'MEASURED_BY', direction: 'INCOMING', target: 'INV'},
        {label: 'MEASURED_BY', direction: 'INCOMING', target: 'ACB'}
      ],
      renderings: [
        {label: 'COMMUNICATION', offset: {x: 700, y: 100}},
        {label: 'ELECTRICAL', offset: {x: 100, y: -100}}
      ]
    },
    {
      label: 'LD',
      name: 'Load',
      relationships: [
        {label: 'COMPRISES', direction: 'INCOMING', target: 'PVA'},
        {label: 'COMPRISES', direction: 'INCOMING', target: 'PVS'},
        {label: 'COMPRISES', direction: 'INCOMING', target: 'PVC'},

        {label: 'FLOWS', direction: 'OUTGOING', target: 'ACB'},
        {label: 'FLOWS', direction: 'OUTGOING', target: 'XFR'},
        {label: 'FLOWS', direction: 'OUTGOING', target: 'IC'}
      ],
      renderings: [
        {label: 'ELECTRICAL', position: {x: 700, y: 200}, root: true}
      ]
    },
    {
      label: 'ACB',
      name: 'AC Bus',
      relationships: [
        {label: 'MEASURED_BY', direction: 'OUTGOING', target: 'RM'},

        {label: 'FLOWS', direction: 'INCOMING', target: 'INV'},
        {label: 'FLOWS', direction: 'INCOMING', target: 'LD'},
        {label: 'FLOWS', direction: 'INCOMING', target: 'ACB'},
        {label: 'FLOWS', direction: 'INCOMING', target: 'XFR'},

        {label: 'FLOWS', direction: 'OUTGOING', target: 'ACB'},
        {label: 'FLOWS', direction: 'OUTGOING', target: 'XFR'},
        {label: 'FLOWS', direction: 'OUTGOING', target: 'IC'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: 200, y: 0}}
      ]
    },
    {
      label: 'XFR',
      name: 'Transformer',
      relationships: [
        {label: 'FLOWS', direction: 'INCOMING', target: 'INV'},
        {label: 'FLOWS', direction: 'INCOMING', target: 'LD'},
        {label: 'FLOWS', direction: 'INCOMING', target: 'ACB'},
        {label: 'FLOWS', direction: 'INCOMING', target: 'XFR'},

        {label: 'FLOWS', direction: 'OUTGOING', target: 'ACB'},
        {label: 'FLOWS', direction: 'OUTGOING', target: 'XFR'},
        {label: 'FLOWS', direction: 'OUTGOING', target: 'IC'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: 200, y: 0}}
      ]
    },
    {
      label: 'IC',
      name: 'Interconnect',
      relationships: [
        {label: 'FLOWS', direction: 'INCOMING', target: 'INV'},
        {label: 'FLOWS', direction: 'INCOMING', target: 'LD'},
        {label: 'FLOWS', direction: 'INCOMING', target: 'ACB'},
        {label: 'FLOWS', direction: 'INCOMING', target: 'XFR'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: 200, y: 0}}
      ]
    },
    {
      label: 'DCB',
      name: 'DC Bus',
      relationships: [
        {label: 'COLLECTS', direction: 'INCOMING', target: 'INV'},

        {label: 'COLLECTS', direction: 'OUTGOING', target: 'APH'},
        {label: 'COLLECTS', direction: 'OUTGOING', target: 'RCB'},
        {label: 'COLLECTS', direction: 'OUTGOING', target: 'CMB'},
        {label: 'COLLECTS', direction: 'OUTGOING', target: 'S'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: -200, y: 0}}
      ]
    },
    {
      label: 'APH',
      name: 'Array',
      relationships: [
        {label: 'COLLECTS', direction: 'INCOMING', target: 'DCB'},
        {label: 'COLLECTS', direction: 'INCOMING', target: 'RCB'},
        {label: 'COLLECTS', direction: 'INCOMING', target: 'CMB'},
        {label: 'COLLECTS', direction: 'INCOMING', target: 'S'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: -200, y: 0}}
      ]
    },
    {
      label: 'RCB',
      name: 'Recombiner',
      relationships: [
        {label: 'MANAGES', direction: 'INCOMING', target: 'DSC'},

        {label: 'COLLECTS', direction: 'INCOMING', target: 'DCB'},

        {label: 'COLLECTS', direction: 'OUTGOING', target: 'APH'},
        {label: 'COLLECTS', direction: 'OUTGOING', target: 'CMB'}

      ],
      renderings: [
        {label: 'COMMUNICATION', offset: {x: 900, y: 0}},
        {label: 'ELECTRICAL', offset: {x: -200, y: 0}}
      ]
    },
    {
      label: 'CMB',
      name: 'Combiner',
      relationships: [
        {label: 'MANAGES', direction: 'INCOMING', target: 'DSC'},

        {label: 'COLLECTS', direction: 'INCOMING', target: 'DCB'},
        {label: 'COLLECTS', direction: 'INCOMING', target: 'RCB'},

        {label: 'COLLECTS', direction: 'OUTGOING', target: 'APH'},
        {label: 'COLLECTS', direction: 'OUTGOING', target: 'S'}
      ],
      renderings: [
        {label: 'COMMUNICATION', offset: {x: 1100, y: 0}},
        {label: 'ELECTRICAL', offset: {x: -200, y: 0}}
      ]
    },
    {
      label: 'S',
      name: 'String',
      relationships: [
        {label: 'COLLECTS', direction: 'INCOMING', target: 'DCB'},
        {label: 'COLLECTS', direction: 'INCOMING', target: 'CMB'},

        {label: 'COLLECTS', direction: 'OUTGOING', target: 'APH'},
        {label: 'COLLECTS', direction: 'OUTGOING', target: 'P'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: -200, y: 0}}
      ]
    },
    {
      label: 'P',
      name: 'Panel',
      relationships: [
        {label: 'COLLECTS', direction: 'INCOMING', target: 'S'},
        {label: 'COLLECTS', direction: 'INCOMING', target: 'P'},

        {label: 'COLLECTS', direction: 'OUTGOING', target: 'P'}
      ],
      renderings: [
        {label: 'ELECTRICAL', offset: {x: -100, y: 0}}
      ]
    }
  ]);
});
