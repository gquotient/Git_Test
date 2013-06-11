define([
  'jquery',
  'underscore',
  'backbone',
  'backbone.marionette',

  './editor_input',
  './editor_util',

  'hbs!project/templates/editorIndex',
  'hbs!project/templates/editorView',
  'hbs!project/templates/editorAdd',
  'hbs!project/templates/editorConnect',
  'hbs!project/templates/editorDisconnect',
  'hbs!project/templates/editorImport'
], function(
  $,
  _,
  Backbone,
  Marionette,

  InputView,
  util,

  editorIndexTemplate,
  editorViewTemplate,
  editorAddTemplate,
  editorConnectTemplate,
  editorDisconnectTemplate,
  editorImportTemplate
){
  var

    ViewView = InputView.extend({
      hotKey: 118, // the v key
      template: {
        type: 'handlebars',
        template: editorViewTemplate
      },

      initialize: function(){
        this.views = new Backbone.Collection(util.filterForView());
      },

      onRender: function(){
        var model = this.views.first();

        if (model) {
          Backbone.trigger('editor:rendering', model.get('label'));
          this.placeholder = model.get('name');

          this.ui.input.val(this.placeholder);
        }
      },

      filterCollection: function(regexp){
        var models = this.views.models;

        if (regexp && models.length > 0) {
          models = _.filter(models, function(model){
            return regexp.test(model.get('name'));
          });
        }

        this.collection.reset(models);
      },

      onApply: function(){
        var model = this.views.findWhere({name: this.parseInput()});

        if (model) {
          Backbone.trigger('editor:rendering', model.get('label'));
          this.placeholder = model.get('name');

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

      initialize: function(){
        this.times = 1;
      },

      filterCollection: function(regexp){
        var models = util.filterForAdd(this.selection);

        if (regexp && models.length > 0) {
          models = _.filter(models, function(model){
            return regexp.test(model.get('name'));
          });
        }

        this.collection.reset(models);
      },

      parseInput: function(){
        var input = this.ui.input.val(),
          re = /^\d+\s*/,
          match = re.exec(input),
          times = match && parseInt(match[0], 10);

        this.times = times > 1 ? times : 1;

        return input.replace(re, '');
      },

      getAutocomplete: function(){
        var value = InputView.prototype.getAutocomplete.call(this);

        if (value && this.times > 1) {
          value = this.times + ' ' + value;
        }

        return value;
      },

      onApply: function(){
        var model = this.collection.findWhere({name: this.parseInput()}),
          targets = this.selection ? this.selection.models : [this.project];

        if (model) {
          _.each(targets, function(target){
            _.times(this.times, function(){
              util.addDevice(model, target, this.project);
            }, this);
          }, this);

          this.ui.input.blur();
        }
      }
    }),

    ConnectView = InputView.extend({
      hotKey: 99, // the c key
      template: {
        type: 'handlebars',
        template: editorConnectTemplate
      },

      filterCollection: function(regexp){
        var models = util.filterForConnect(this.selection, this.project.devices);

        if (regexp && models.length > 0) {
          models = _.filter(models, function(model){
            return regexp.test(model.get('name'));
          });
        }

        this.collection.reset(models);
      },

      onApply: function(){
        var model = this.collection.findWhere({name: this.parseInput()});

        if (model) {
          if (this.selection) {
            this.selection.each(function(target){
              util.connectDevice(model, target, this.project);
            }, this);
          }

          this.ui.input.blur();
        }
      }
    }),

    DisconnectView = InputView.extend({
      hotKey: 100, // the d key
      template: {
        type: 'handlebars',
        template: editorDisconnectTemplate
      },

      filterCollection: function(regexp){
        var models = util.filterForDisconnect(this.selection);

        if (regexp && models.length > 0) {
          models = _.filter(models, function(model){
            return regexp.test(model.get('name'));
          });
        }

        this.collection.reset(models);
      },

      onApply: function(){
        var model = this.collection.findWhere({name: this.parseInput()});

        if (model) {
          if (this.selection) {
            this.selection.each(function(target){
              util.disconnectDevice(model, target, this.project);
            }, this);
          }

          this.ui.input.blur();
        }
      }
    }),

    ImportView = InputView.extend({
      hotKey: 105, // the i key
      template: {
        type: 'handlebars',
        template: editorImportTemplate
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
      view: '#view',
      add: '#add',
      connect: '#connect',
      disconnect: '#disconnect',
      import: '#import'
    },

    onShow: function(){
      this.view.show( new ViewView({project: this.model}) );
      this.add.show( new AddView({project: this.model}) );
      this.connect.show( new ConnectView({project: this.model}) );
      this.disconnect.show( new DisconnectView({project: this.model}) );
      this.import.show( new ImportView({project: this.model}) );
    }
  });
});
