define([
  'jquery',
  'underscore',
  'backbone',

  'device'
], function(
  $,
  _,
  Backbone,

  Device
){
  var
    Model = Backbone.Model.extend({

      createDevice: function(project, parnt){
        var index = this.nextIndex(project, 1),
          parent_id = parnt.get('id'),

          rel = _.findWhere(this.get('relationships'), {
            direction: 'INCOMING',
            device_type: parnt.get('device_type')
          }, this),

          position = {
            x: parnt.get('positionX') || 700,
            y: parnt.get('positionY') || 200
          };

        if (!parent_id) { return null; }

        if (!rel || !rel.device_type || !rel.relationship_label) {
          rel = {relationship_label: 'COMPRISES'};
        }

        position = this.adjustPosition(project, position);

        return new Device.Model({
          name: this.get('name') + ' ' + index,
          did: this.get('prefix') + '-' + index,
          device_type: this.get('device_type'),

          project_label: project.get('label'),
          parent_id: parent_id,
          relationship_label: rel.relationship_label,

          positionX: position.x,
          positionY: position.y
        });
      },

      nextIndex: function(project, index){
        var num, type = this.get('device_type');

        project.devices.each(function(model){
          if (model.get('device_type') === type) {
            num = parseInt(model.get('did').replace(/^.*-/, ''), 10);
            if (num && num >= index) { index = num + 1; }
          }
        });

        return index;
      },

      adjustPosition: function(project, position){
        var type = this.get('device_type'),
          offset = this.get('positionOffset');

        if (this.get('root')) {
          project.devices.each(function(model){
            if (model.get('device_type') === type && model.get('positionY') >= position.y) {
              position.x = model.get('positionX');
              position.y = model.get('positionY') + 200;
            }
          });
        } else if (offset) {
          position.x += offset.x;
          position.y += offset.y;
        }

        while (project.devices.findWhere({positionX: position.x, positionY: position.y})) {
          position.y += 200;
        }

        return position;
      }
    }),

    Library = Backbone.Collection.extend({
      model: Model,

      filterByType: Device.Collection.prototype.filterByType,

      mapRelationshipTypes: function(types, props){
        return _.intersection.apply(this, _.map(this.filterByType(types), function(model){
          var relationships = model.get('relationships');

          if (props) { relationships = _.where(relationships, props); }

          return _.pluck(relationships, 'device_type');
        }));
      }
    });


  return new Library([
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
