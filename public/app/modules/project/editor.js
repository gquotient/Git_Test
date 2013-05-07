define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',
  'paper',

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

  editorIndexTemplate,
  editorImportTemplate,
  editorMoveTemplate,
  editorAddTemplate,
  editorPendingTemplate
){
  var
    ImportView = Marionette.ItemView.extend({
      template: {
        type: 'handlebars',
        template: editorImportTemplate
      }
    }),

    MoveView = Marionette.ItemView.extend({
      template: {
        type: 'handlebars',
        template: editorMoveTemplate
      }
    }),

    AddView = Marionette.ItemView.extend({
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
      this.paperScope = options.paperScope;
    },

    onShow: function(){
      this.import.show( new ImportView() );
      this.move.show( new MoveView() );
      this.add.show( new AddView() );
      this.pending.show( new PendingView() );
    }
  });
});
