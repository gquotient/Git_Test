define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'device',
  'library',

  './editor_input',

  'hbs!project/templates/editorIndex',
  'hbs!project/templates/editorImport',
  'hbs!project/templates/editorMove',
  'hbs!project/templates/editorAdd',
  'hbs!project/templates/editorPending'
], function(
  $,
  _,
  Backbone,
  Marionette,

  Device,
  deviceLibrary,

  InputView,

  editorIndexTemplate,
  editorImportTemplate,
  editorMoveTemplate,
  editorAddTemplate,
  editorPendingTemplate
){
  var

    ImportView = InputView.extend({
      hotKey: 105, // the i key
      template: {
        type: 'handlebars',
        template: editorImportTemplate
      }
    }),

    MoveView = InputView.extend({
      hotKey: 109, // the m key
      template: {
        type: 'handlebars',
        template: editorMoveTemplate
      },

      filterCollection: function(regexp){
        var targets = [];

        if (this.selection) {
          targets = this.project.devices.filterByType(
            deviceLibrary.mapRelationshipTypes(
              this.selection.pluck('device_type'),
              {direction: 'INCOMING'}
            )
          );

          targets = _.reject(targets, function(target){
            return this.selection.any(function(model){
              return model === target || model.hasChild(target);
            });
          }, this);
        }

        if (regexp && targets.length > 0) {
          targets = _.filter(targets, function(target){
            return regexp.test(target.get('name'));
          });
        }

        this.collection.reset(targets);
      },

      onApply: function(){
        var input = this.parseInput(),
          target = this.collection.findWhere({name: input.name});

        if (target) {
          this.selection.each(function(model){
            //model.moveTo(target);
          });

          this.ui.input.blur();
        }
      }
    }),

    AddView = InputView.extend({
      hotKey: 97, // the a key
      template: {
        type: 'handlebars',
        template: editorAddTemplate
      },

      filterCollection: function(regexp){
        var models = [];

        if (this.selection) {
          models = deviceLibrary.filterByType(
            deviceLibrary.mapRelationshipTypes(
              this.selection.pluck('device_type'),
              {direction: 'OUTGOING'}
            )
          );
        } else {
          models = deviceLibrary.where({root: true});
        }

        if (regexp && models.length > 0) {
          models = _.filter(models, function(model){
            return regexp.test(model.get('name'));
          });
        }

        this.collection.reset(models);
      },

      onApply: function(){
        var input = this.parseInput(),
          model = this.collection.findWhere({name: input.name});

        if (model) {
          _.each(this.selection ? this.selection.models : [this.project], function(parnt){
            _.times(input.times, function(){
              var device = model.createDevice(this.project, parnt);

              if (device) {
                this.project.devices.add(device);

                parnt.outgoing.add(device);
                device.incoming.add(parnt);

                device.save();
              }
            }, this);
          }, this);

          this.ui.input.blur();
        }
      }
    }),

    PendingView = Marionette.ItemView.extend({
      template: {
        type: 'handlebars',
        template: editorPendingTemplate
      }
    });

  return Marionette.Layout.extend({
    template: {
      type: 'handlebars',
      template: editorIndexTemplate
    },

    attributes: {
      id: 'overlay'
    },

    regions: {
      import: '#import',
      move: '#move',
      add: '#add',
      pending: '#pending'
    },

    onShow: function(){
      this.import.show( new ImportView({project: this.model}) );
      this.move.show( new MoveView({project: this.model}) );
      this.add.show( new AddView({project: this.model}) );
      this.pending.show( new PendingView({project: this.model}) );
    }
  });
});
