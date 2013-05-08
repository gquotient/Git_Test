define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'paper',

  './editor_select',

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
  paper,

  SelectView,

  editorIndexTemplate,
  editorImportTemplate,
  editorMoveTemplate,
  editorAddTemplate,
  editorPendingTemplate
){
  var
    ImportView = SelectView.extend({
      hotKey: 105, // the i key
      template: {
        type: 'handlebars',
        template: editorImportTemplate
      }
    }),

    MoveView = SelectView.extend({
      hotKey: 109, // the m key
      template: {
        type: 'handlebars',
        template: editorMoveTemplate
      }
    }),

    AddView = SelectView.extend({
      hotKey: 97, // the a key
      template: {
        type: 'handlebars',
        template: editorAddTemplate
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

    initialize: function(options){
      this.paper = options.paper;
    },

    onShow: function(){
      this.import.show( new ImportView() );
      this.move.show( new MoveView() );
      this.add.show( new AddView() );
      this.pending.show( new PendingView() );
    }
  });
});
