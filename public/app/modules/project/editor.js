define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  'device',
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
  InputView,

  editorIndexTemplate,
  editorImportTemplate,
  editorMoveTemplate,
  editorAddTemplate,
  editorPendingTemplate
){
  var
    // deviceLibrary = new Device.LibraryCollection( JSON.parse($('#bootstrapDeviceLibrary').html()) ),

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
        var types, models = [];

        if (this.selection) {
          types = this.findValidEdgeTypes(this.selection.pluck('type'));

          models = this.options.project.devices.filter(function(model){
            if (this.selection.contains(model)) { return false; }
            return _.contains(types, model.get('type'));
          }, this);
        }

        if (regexp && models.length > 0) {
          models = _.filter(models, function(model){
            return regexp.test(model.get('name')) || regexp.test(model.get('type'));
          });
        }

        this.collection.reset(models);
      },

      findValidEdgeTypes: function(types){
        var models = deviceLibrary.filter(function(model){
          return _.contains(types, model.get('type'));
        });

        return _.intersection.apply(this, _.invoke(models, 'get', 'validEdges'));
      }
    }),

    AddView = InputView.extend({
      hotKey: 97, // the a key
      template: {
        type: 'handlebars',
        template: editorAddTemplate
      },

      filterCollection: function(regexp){
        var types, models = [];

        if (this.selection) {
          types = _.uniq(this.selection.pluck('type'));

          models = deviceLibrary.filter(function(model){
            return (_.difference(types, model.get('validEdges')).length === 0);
          });
        } else {
          models = deviceLibrary.where({root: true});
        }

        if (regexp && models.length > 0) {
          models = _.filter(models, function(model){
            return regexp.test(model.get('name'));
          });
        }

        this.collection.reset(models);
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
